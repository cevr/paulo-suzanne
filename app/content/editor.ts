import { Cause, Clock, Effect, Schema, SchemaIssue } from 'effect';

import {
  AdminImageUploadError,
  ingestAdminImage,
} from '~/lib/admin-image-upload';
import {
  findAsset,
  MANAGED_ASSETS,
  MENU_PDF_ASSET_KEY,
  MENU_PDF_PUBLIC_HREF,
} from '~/lib/managed-assets';
import { Railway, RailwayDisabled, RailwayError } from '~/services/Railway';
import { Storage } from '~/services/Storage';

import { defaultContent } from './defaults';
import {
  editorSectionForContentPath,
  type EditorSectionKey,
} from './editor-sections';
import { loadAdminContent, normalizeSiteContentAssets } from './loader';
import { SiteContent } from './schema';

const CONTENT_KEY = 'content/site.json';
const DRAFT_CONTENT_KEY = 'content/site.draft.json';
const PUBLISH_STATE_KEY = 'content/publish-state.json';
const IN_FLIGHT_TIMEOUT_MS = 90_000;

const PublishState = Schema.Struct({
  contentHash: Schema.NullOr(Schema.NonEmptyString),
  lastDeploymentId: Schema.NullOr(Schema.NonEmptyString),
  lastPublishedAt: Schema.NullOr(Schema.Number),
  inFlight: Schema.NullOr(
    Schema.Struct({
      hash: Schema.NonEmptyString,
      startedAt: Schema.Number,
    }),
  ),
});
type PublishState = typeof PublishState.Type;

export type EditorFieldErrors = Partial<Record<EditorSectionKey, string[]>>;

export type EditorModel = {
  readonly content: SiteContent;
  readonly contentSource: 'draft' | 'published' | 'defaults';
  readonly draftLastModified: number | null;
  readonly assetKeys: readonly string[];
  readonly assetListFailed: boolean;
  readonly isUsingDefaults: boolean;
  readonly railwayEnabled: boolean;
  readonly lastDeploymentId: string | null;
  readonly lastPublishedAt: number | null;
};

type EditorRedirect = {
  readonly _tag: 'Redirect';
  readonly status: string;
  readonly published: boolean;
  readonly deploymentId?: string;
};

type EditorRejected = {
  readonly _tag: 'Rejected';
  readonly status: number;
  readonly error: string;
  readonly fieldErrors: EditorFieldErrors;
};

export type EditorMutation = EditorRedirect | EditorRejected;

const decodePublishState = Schema.decodeUnknownEffect(
  Schema.fromJsonString(PublishState),
);
const decodeContent = Schema.decodeUnknownEffect(SiteContent);
const formatIssue = SchemaIssue.makeFormatterStandardSchemaV1();

const readPublishState = Effect.fn('Content.readPublishState')(function* () {
  const storage = yield* Storage;
  const exit = yield* Effect.exit(
    Effect.gen(function* () {
      const object = yield* storage.get(PUBLISH_STATE_KEY);
      const text = yield* Effect.promise(() => new Response(object.stream).text());
      return yield* decodePublishState(text);
    }),
  );
  return exit._tag === 'Success' ? exit.value : null;
});

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function hashContent(content: SiteContent): string {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(JSON.stringify(canonicalize(content)));
  return hasher.digest('hex');
}

type MutableRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MutableRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordAt(parent: MutableRecord, key: string): MutableRecord {
  const current = parent[key];
  if (isRecord(current)) return current;
  const next: MutableRecord = {};
  parent[key] = next;
  return next;
}

function deriveLockedAssetFields(input: unknown): MutableRecord {
  const content = isRecord(input) ? (structuredClone(input) as MutableRecord) : {};
  const menu = recordAt(content, 'menu');
  const jsonLd = recordAt(content, 'jsonLd');
  const meta = recordAt(content, 'meta');
  const ogImage = recordAt(meta, 'ogImage');
  const imageKey = ogImage['key'];

  menu['pdfHref'] = MENU_PDF_PUBLIC_HREF;
  jsonLd['imageKey'] =
    typeof imageKey === 'string' && imageKey.length > 0
      ? imageKey
      : defaultContent.jsonLd.imageKey;
  jsonLd['menuPath'] = MENU_PDF_PUBLIC_HREF;
  return content;
}

function imageUploadFieldFromIntent(intent: string): string | null {
  const prefix = 'upload-image:';
  if (!intent.startsWith(prefix)) return null;
  const fieldName = intent.slice(prefix.length);
  return fieldName.length > 0 ? fieldName : null;
}

function coerceFormValue(path: readonly string[], value: string): unknown {
  const leaf = path[path.length - 1];
  if (leaf === 'width' || leaf === 'height') return value === '' ? value : Number(value);
  return value;
}

function isNumericSegment(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function ensureContainer(
  parent: Record<string, unknown> | unknown[],
  segment: string,
  nextSegment: string | undefined,
): Record<string, unknown> | unknown[] {
  const key = Array.isArray(parent) ? Number(segment) : segment;
  const existing = parent[key as keyof typeof parent];
  if (Array.isArray(existing) || (typeof existing === 'object' && existing !== null)) {
    return existing as Record<string, unknown> | unknown[];
  }
  const next = nextSegment !== undefined && isNumericSegment(nextSegment) ? [] : {};
  (parent as Record<string, unknown>)[String(key)] = next;
  return next;
}

function setPath(root: Record<string, unknown>, path: readonly string[], value: unknown): void {
  if (path.length === 0) return;
  let cursor: Record<string, unknown> | unknown[] = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    if (segment === undefined) return;
    cursor = ensureContainer(cursor, segment, path[index + 1]);
  }
  const leaf = path[path.length - 1];
  if (leaf === undefined) return;
  if (Array.isArray(cursor) && isNumericSegment(leaf)) {
    cursor[Number(leaf)] = value;
  } else {
    (cursor as Record<string, unknown>)[leaf] = value;
  }
}

function assembleFromFormData(form: FormData): unknown {
  const root: Record<string, unknown> = {};
  for (const rawName of form.getAll('_array')) {
    if (typeof rawName === 'string' && rawName.trim() !== '') {
      setPath(root, rawName.split('.'), []);
    }
  }
  for (const [name, value] of form.entries()) {
    if (typeof value !== 'string' || name.startsWith('_') || name === 'intent') continue;
    const path = name.split('.');
    setPath(root, path, coerceFormValue(path, value));
  }
  return root;
}

function pathSegmentKey(
  segment: PropertyKey | { readonly key: PropertyKey },
): PropertyKey {
  return typeof segment === 'object' && segment !== null && 'key' in segment
    ? segment.key
    : segment;
}

function fieldErrorsFromIssue(issue: SchemaIssue.Issue): EditorFieldErrors {
  const result: EditorFieldErrors = {};
  const formatted = formatIssue(issue);
  for (const entry of formatted.issues) {
    const rawHead = entry.path?.[0];
    if (rawHead === undefined) continue;
    const head = pathSegmentKey(rawHead);
    if (!(head in defaultContent)) continue;
    const rawTailHead = entry.path?.[1];
    const tailHead = rawTailHead === undefined ? undefined : pathSegmentKey(rawTailHead);
    const section = editorSectionForContentPath(
      head as keyof SiteContent,
      tailHead,
    );
    const tail = entry.path?.slice(1).map((part) => String(pathSegmentKey(part))).join('.') ?? '';
    const list = result[section] ?? [];
    list.push(tail ? `${entry.message} (at ${tail})` : entry.message);
    result[section] = list;
  }
  return result;
}

function schemaIssueFromCause(cause: Cause.Cause<unknown>): SchemaIssue.Issue | null {
  for (const reason of cause.reasons) {
    if (!Cause.isFailReason(reason)) continue;
    const error = reason.error;
    if (typeof error === 'object' && error !== null && 'issue' in error) {
      const issue = error.issue;
      if (SchemaIssue.isIssue(issue)) return issue;
    }
  }
  return null;
}

export const loadEditor = Effect.fn('Content.loadEditor')(function* () {
  const contentLoad = yield* loadAdminContent;
  const railway = yield* Railway;
  const storage = yield* Storage;
  const railwayEnabled = yield* railway.enabled;
  const publishState = yield* readPublishState();
  const assetListExit = yield* Effect.exit(storage.list());
  const assetKeys =
    assetListExit._tag === 'Success'
      ? assetListExit.value
          .map((item) => item.key)
          .filter((key) => !key.startsWith('content/'))
      : MANAGED_ASSETS.map((asset) => asset.key);
  const content = normalizeSiteContentAssets(contentLoad.content);

  return {
    content,
    contentSource: contentLoad.source,
    draftLastModified: contentLoad.draftLastModified,
    assetKeys,
    assetListFailed: assetListExit._tag !== 'Success',
    isUsingDefaults:
      contentLoad.source === 'defaults' ||
      JSON.stringify(content) === JSON.stringify(defaultContent),
    railwayEnabled,
    lastDeploymentId: publishState?.lastDeploymentId ?? null,
    lastPublishedAt: publishState?.lastPublishedAt ?? null,
  } satisfies EditorModel;
});

const rejected = (
  status: number,
  error: string,
  fieldErrors: EditorFieldErrors = {},
): EditorRejected => ({ _tag: 'Rejected', status, error, fieldErrors });

export const submitEditor = Effect.fn('Content.submitEditor')(function* (form: FormData) {
  const storage = yield* Storage;
  const railway = yield* Railway;
  const intent = String(form.get('intent') ?? 'save-draft');
  const imageUploadField = imageUploadFieldFromIntent(intent);

  if (imageUploadField !== null) {
    const file = form.get(`${imageUploadField}.__file`);
    if (!(file instanceof File)) {
      return rejected(400, 'Choose an image before uploading.');
    }
    const now = yield* Clock.currentTimeMillis;
    const imageExit = yield* Effect.exit(ingestAdminImage(file, now));
    if (imageExit._tag === 'Failure') {
      for (const reason of imageExit.cause.reasons) {
        if (Cause.isFailReason(reason) && Schema.is(AdminImageUploadError)(reason.error)) {
          return rejected(400, reason.error.message);
        }
      }
      return yield* Effect.failCause(imageExit.cause);
    }

    const draftInput = deriveLockedAssetFields(assembleFromFormData(form));
    setPath(draftInput, `${imageUploadField}.key`.split('.'), imageExit.value.key);
    setPath(draftInput, `${imageUploadField}.width`.split('.'), imageExit.value.width);
    setPath(draftInput, `${imageUploadField}.height`.split('.'), imageExit.value.height);
    const decodeExit = yield* Effect.exit(decodeContent(draftInput));
    if (decodeExit._tag === 'Failure') {
      const issue = schemaIssueFromCause(decodeExit.cause);
      return rejected(
        400,
        issue
          ? 'The image was uploaded, but some fields need attention before the Draft can be saved.'
          : `Content validation failed: ${String(decodeExit.cause)}`,
        issue ? fieldErrorsFromIssue(issue) : {},
      );
    }
    yield* storage.put(
      DRAFT_CONTENT_KEY,
      JSON.stringify(decodeExit.value, null, 2),
      'application/json',
    );
    return {
      _tag: 'Redirect',
      status: 'Image uploaded and Draft saved.',
      published: false,
    } satisfies EditorRedirect;
  }

  if (intent === 'upload-menu-pdf') {
    const file = form.get('file');
    const asset = findAsset(MENU_PDF_ASSET_KEY);
    if (asset === undefined) return rejected(500, 'Menu PDF asset is not configured.');
    if (!(file instanceof File) || file.size === 0) {
      return rejected(400, 'Choose a PDF before uploading.');
    }
    const buffer = yield* Effect.tryPromise(() => file.arrayBuffer());
    yield* storage.put(asset.key, new Uint8Array(buffer), file.type || asset.accept);
    return {
      _tag: 'Redirect',
      status: 'Menu PDF uploaded.',
      published: false,
    } satisfies EditorRedirect;
  }

  if (intent === 'discard-draft') {
    yield* storage.delete(DRAFT_CONTENT_KEY).pipe(Effect.catch(() => Effect.void));
    return {
      _tag: 'Redirect',
      status: 'Draft discarded.',
      published: false,
    } satisfies EditorRedirect;
  }

  if (intent !== 'save-draft' && intent !== 'publish') {
    return rejected(400, 'Unknown submit intent.');
  }

  const decodeExit = yield* Effect.exit(
    decodeContent(deriveLockedAssetFields(assembleFromFormData(form))),
  );
  if (decodeExit._tag === 'Failure') {
    const issue = schemaIssueFromCause(decodeExit.cause);
    return rejected(
      400,
      issue
        ? 'Some fields need attention before this can be saved.'
        : `Content validation failed: ${String(decodeExit.cause)}`,
      issue ? fieldErrorsFromIssue(issue) : {},
    );
  }

  const content = decodeExit.value;
  if (intent === 'save-draft') {
    yield* storage.put(DRAFT_CONTENT_KEY, JSON.stringify(content, null, 2), 'application/json');
    return {
      _tag: 'Redirect',
      status: 'Draft saved.',
      published: false,
    } satisfies EditorRedirect;
  }

  const newHash = hashContent(content);
  const previous = yield* readPublishState();
  const now = yield* Clock.currentTimeMillis;

  if (previous?.contentHash === newHash) {
    yield* storage.delete(DRAFT_CONTENT_KEY).pipe(Effect.catch(() => Effect.void));
    return {
      _tag: 'Redirect',
      status: previous.lastDeploymentId
        ? 'No changes to publish. The live website is already up to date.'
        : 'No changes to publish.',
      published: true,
      ...(previous.lastDeploymentId === null
        ? {}
        : { deploymentId: previous.lastDeploymentId }),
    } satisfies EditorRedirect;
  }

  if (
    previous?.inFlight &&
    now - previous.inFlight.startedAt < IN_FLIGHT_TIMEOUT_MS
  ) {
    return rejected(409, 'Publishing is already underway. Wait a moment, then try again.');
  }

  const inFlightState: PublishState = {
    contentHash: previous?.contentHash ?? null,
    lastDeploymentId: previous?.lastDeploymentId ?? null,
    lastPublishedAt: previous?.lastPublishedAt ?? null,
    inFlight: { hash: newHash, startedAt: now },
  };
  yield* storage.put(PUBLISH_STATE_KEY, JSON.stringify(inFlightState, null, 2), 'application/json');
  yield* storage.put(CONTENT_KEY, JSON.stringify(content, null, 2), 'application/json');

  const deployExit = yield* Effect.exit(railway.triggerDeploy);
  let deploymentId: string | null = null;
  let status = 'Changes saved, but the website could not be updated.';
  let published = false;
  if (deployExit._tag === 'Success') {
    deploymentId = deployExit.value.deploymentId;
    published = true;
    status = 'Published. The website should update within about a minute.';
  } else {
    for (const reason of deployExit.cause.reasons) {
      if (!Cause.isFailReason(reason)) continue;
      if (Schema.is(RailwayDisabled)(reason.error)) {
        status = 'Changes saved. Automatic website updates are not configured.';
      } else if (Schema.is(RailwayError)(reason.error)) {
        status = `Changes saved, but the website update failed: ${reason.error.message}`;
      }
    }
  }

  const railwaySucceededOrDisabled =
    deployExit._tag === 'Success' ||
    (deployExit._tag === 'Failure' &&
      [...deployExit.cause.reasons].some(
        (reason) =>
          Cause.isFailReason(reason) && Schema.is(RailwayDisabled)(reason.error),
      ));
  const finalState: PublishState = {
    contentHash: railwaySucceededOrDisabled
      ? newHash
      : (previous?.contentHash ?? null),
    lastDeploymentId: deploymentId ?? previous?.lastDeploymentId ?? null,
    lastPublishedAt: railwaySucceededOrDisabled
      ? now
      : (previous?.lastPublishedAt ?? null),
    inFlight: null,
  };
  yield* storage.put(PUBLISH_STATE_KEY, JSON.stringify(finalState, null, 2), 'application/json');
  yield* storage.delete(DRAFT_CONTENT_KEY).pipe(Effect.catch(() => Effect.void));

  return {
    _tag: 'Redirect',
    status,
    published,
    ...(deploymentId === null ? {} : { deploymentId }),
  } satisfies EditorRedirect;
});
