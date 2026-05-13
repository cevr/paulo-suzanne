import { Cause, Clock, DateTime, Effect, Schema, SchemaIssue } from 'effect';
import { Upload } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Form, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  deriveLockedAssetFields,
  deriveLockedSiteContentAssets,
} from '~/content/derived-assets';
import { loadAdminContent } from '~/content/loader';
import { defaultContent } from '~/content/defaults';
import {
  hashContent,
  IN_FLIGHT_TIMEOUT_MS,
  PUBLISH_STATE_KEY,
  PublishState,
} from '~/content/publish-state';
import { SiteContent } from '~/content/schema';
import {
  ADMIN_IMAGE_UPLOAD_MAX_EDGE,
  processAdminImageUpload,
} from '~/lib/admin-image-upload';
import { ReactRouterContext } from '~/lib/effect/router-context';
import {
  findAsset,
  MANAGED_ASSETS,
  MENU_PDF_ASSET_KEY,
} from '~/lib/managed-assets';
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  ADMIN_IMAGE_UPLOAD_CONTENT_TYPE,
  isAcceptedAdminImageType,
} from '~/lib/uploaded-image-assets';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { Auth } from '~/services/Auth';
import { Railway, RailwayDisabled, RailwayError } from '~/services/Railway';
import { Storage } from '~/services/Storage';

import {
  assetOptionsFromKeys,
  fallbackImageAssets,
  type AssetOption,
} from './_components/asset-picker';
import {
  AboutSection,
  ContactSection,
  FooterSection,
  HeaderSection,
  HeroSection,
  JsonLdSection,
  LocationSection,
  MENU_PDF_UPLOAD_FORM_ID,
  MenuPdfSection,
  MenuSection,
  MetaSection,
} from './_components/sections';

const CONTENT_KEY = 'content/site.json';
const DRAFT_CONTENT_KEY = 'content/site.draft.json';

const decodePublishState = Schema.decodeUnknownEffect(
  Schema.fromJsonString(PublishState),
);
const encodePublishState = (state: PublishState) =>
  JSON.stringify(state, null, 2);

const readPublishState = Effect.fn('readPublishState')(function* () {
  const storage = yield* Storage;
  const exit = yield* Effect.exit(
    Effect.gen(function* () {
      const obj = yield* storage.get(PUBLISH_STATE_KEY);
      const text = yield* Effect.promise(() =>
        new Response(obj.stream).text(),
      );
      return yield* decodePublishState(text);
    }),
  );
  if (exit._tag === 'Success') return exit.value;
  // Treat any failure (NotFound, parse error, schema mismatch) as "no state".
  return null;
});

const SECTIONS = [
  'meta',
  'header',
  'hero',
  'about',
  'menu',
  'menuPdf',
  'location',
  'contact',
  'footer',
  'jsonLd',
] as const;

type SectionKey = (typeof SECTIONS)[number];
type ContentSectionKey = keyof SiteContent;

type FieldErrors = Partial<Record<SectionKey, string[]>>;

type ActionResult =
  | { ok: true; published: boolean; message: string }
  | {
      ok: false;
      error: string;
      fieldErrors: FieldErrors;
    };

const decodeContent = Schema.decodeUnknownEffect(SiteContent);
const formatIssue = SchemaIssue.makeFormatterStandardSchemaV1();

type SubmitIntent =
  | 'save-draft'
  | 'publish'
  | 'discard-draft'
  | 'upload-menu-pdf'
  | 'upload-image';

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
  if (
    (Array.isArray(existing) || (typeof existing === 'object' && existing !== null)) &&
    existing !== undefined
  ) {
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
    return;
  }
  (cursor as Record<string, unknown>)[leaf] = value;
}

function assembleFromFormData(form: FormData): unknown {
  const root: Record<string, unknown> = {};
  for (const rawName of form.getAll('_array')) {
    if (typeof rawName !== 'string' || rawName.trim() === '') continue;
    setPath(root, rawName.split('.'), []);
  }
  for (const [name, value] of form.entries()) {
    if (typeof value !== 'string') continue;
    if (name.startsWith('_') || name === 'intent') continue;
    const path = name.split('.');
    setPath(root, path, coerceFormValue(path, value));
  }
  return root;
}

function isContentSectionKey(key: PropertyKey): key is ContentSectionKey {
  return key in defaultContent;
}

function pathSegmentKey(
  segment: PropertyKey | { readonly key: PropertyKey },
): PropertyKey {
  return typeof segment === 'object' && segment !== null && 'key' in segment
    ? segment.key
    : segment;
}

function sectionKeyFromIssuePath(
  head: ContentSectionKey,
  tailHead: PropertyKey | undefined,
): SectionKey {
  if (
    head === 'menu' &&
    (tailHead === 'pdfHeading' ||
      tailHead === 'pdfBody' ||
      tailHead === 'pdfCta' ||
      tailHead === 'pdfHref' ||
      tailHead === 'disclaimer')
  ) {
    return 'menuPdf';
  }
  return head;
}

/**
 * Walks a Schema decode error and groups messages by top-level section. The
 * Standard Schema V1 formatter flattens issue paths to dotted property keys
 * (e.g. ["meta", "title", "en"]); we key by path[0] which is always one of
 * the SECTIONS.
 */
function fieldErrorsFromIssue(issue: SchemaIssue.Issue): FieldErrors {
  const result: FieldErrors = {};
  const formatted = formatIssue(issue);
  for (const entry of formatted.issues) {
    const rawHead = entry.path?.[0];
    if (rawHead === undefined) continue;
    const head = pathSegmentKey(rawHead);
    if (!isContentSectionKey(head)) continue;
    const rawTailHead = entry.path?.[1];
    const tailHead =
      rawTailHead === undefined ? undefined : pathSegmentKey(rawTailHead);
    const section = sectionKeyFromIssuePath(head, tailHead);
    const tail =
      entry.path && entry.path.length > 1
        ? entry.path
            .slice(1)
            .map((s) => String(pathSegmentKey(s)))
            .join('.')
        : '';
    const suffix = tail ? ` (at ${tail})` : '';
    const list = result[section] ?? [];
    list.push(`${entry.message}${suffix}`);
    result[section] = list;
  }
  return result;
}

export const loader = routeHandler(function* () {
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
  const content = deriveLockedSiteContentAssets(contentLoad.content);
  return {
    content,
    contentSource: contentLoad.source,
    draftLastModified: contentLoad.draftLastModified,
    assetOptions:
      assetListExit._tag === 'Success'
        ? assetOptionsFromKeys(assetKeys)
        : fallbackImageAssets(),
    assetListFailed: assetListExit._tag !== 'Success',
    isUsingDefaults:
      contentLoad.source === 'defaults' ||
      JSON.stringify(content) === JSON.stringify(defaultContent),
    railwayEnabled,
    lastDeploymentId: publishState?.lastDeploymentId ?? null,
    lastPublishedAt: publishState?.lastPublishedAt ?? null,
  };
});

export const action = routeAction(function* () {
  const { request } = yield* ReactRouterContext;
  const auth = yield* Auth;
  yield* auth.checkCookie(request.headers.get('cookie'));

  const storage = yield* Storage;
  const railway = yield* Railway;

  const form = yield* Effect.tryPromise(() => request.formData());
  const intent = String(form.get('intent') ?? 'save-draft') as SubmitIntent;

  if (intent === 'upload-image') {
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: 'Choose an image before uploading.' }, { status: 400 });
    }
    if (!isAcceptedAdminImageType(file.type)) {
      return Response.json(
        { error: 'Upload a JPEG, PNG, WebP, GIF, or AVIF image.' },
        { status: 400 },
      );
    }

    const now = yield* Clock.currentTimeMillis;
    const processed = yield* processAdminImageUpload(file, now).pipe(
      Effect.catch((error) =>
        Effect.succeed(
          Response.json(
            { error: `Image processing failed: ${error.message}` },
            { status: 400 },
          ),
        ),
      ),
    );
    if (processed instanceof Response) return processed;

    yield* storage.put(
      processed.key,
      processed.bytes,
      ADMIN_IMAGE_UPLOAD_CONTENT_TYPE,
    );
    yield* storage.put(
      processed.thumbnailKey,
      processed.thumbnailBytes,
      ADMIN_IMAGE_UPLOAD_CONTENT_TYPE,
    );
    const params = new URLSearchParams({
      status: `Image uploaded: ${processed.key} (${processed.width}x${processed.height}); thumbnail ${processed.thumbnailKey} (${processed.thumbnailWidth}x${processed.thumbnailHeight})`,
      published: '0',
    });
    return redirect(`/admin?${params.toString()}`);
  }

  if (intent === 'upload-menu-pdf') {
    const file = form.get('file');
    const asset = findAsset(MENU_PDF_ASSET_KEY);
    if (asset === undefined) {
      return Response.json({ error: 'Menu PDF asset is not configured.' }, { status: 500 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: 'Choose a PDF before uploading.' }, { status: 400 });
    }

    const buf = yield* Effect.tryPromise(() => file.arrayBuffer());
    const contentType = file.type || asset.accept;
    yield* storage.put(asset.key, new Uint8Array(buf), contentType);
    return redirect('/admin?status=Menu%20PDF%20uploaded.&published=0');
  }

  if (intent === 'discard-draft') {
    yield* storage.delete(DRAFT_CONTENT_KEY).pipe(Effect.catch(() => Effect.void));
    return redirect(
      '/admin?status=Draft%20discarded.&published=0',
    );
  }

  if (intent !== 'save-draft' && intent !== 'publish') {
    const result: ActionResult = {
      ok: false,
      error: 'Unknown submit intent.',
      fieldErrors: {},
    };
    return Response.json(result, { status: 400 });
  }

  const draft = deriveLockedAssetFields(assembleFromFormData(form));
  const decodeExit = yield* Effect.exit(decodeContent(draft));
  if (decodeExit._tag !== 'Success') {
    // Walk the cause to find a SchemaIssue. SchemaError wraps it; otherwise
    // fall back to a stringified cause in a synthetic top-level entry.
    let issue: SchemaIssue.Issue | null = null;
    for (const reason of decodeExit.cause.reasons) {
      if (Cause.isFailReason(reason)) {
        const err = reason.error as { issue?: unknown };
        if (err && SchemaIssue.isIssue(err.issue)) {
          issue = err.issue;
          break;
        }
      }
    }
    const fieldErrors: FieldErrors = issue
      ? fieldErrorsFromIssue(issue)
      : {};
    const result: ActionResult = {
      ok: false,
      error: issue
        ? 'Schema validation failed. See per-section errors below.'
        : `Schema validation failed: ${String(decodeExit.cause)}`,
      fieldErrors,
    };
    return Response.json(result, { status: 400 });
  }

  const content = decodeExit.value;

  if (intent === 'save-draft') {
    const json = JSON.stringify(content, null, 2);
    yield* storage.put(DRAFT_CONTENT_KEY, json, 'application/json');
    return redirect(
      '/admin?status=Draft%20saved.&published=0&draft=1',
    );
  }

  const newHash = hashContent(content);

  // Read existing publish-state to drive idempotency + best-effort lock.
  const prevState = yield* readPublishState();
  const now = yield* Clock.currentTimeMillis;

  // Idempotency: identical content → no rewrite, no redeploy.
  if (prevState && prevState.contentHash === newHash) {
    yield* storage.delete(DRAFT_CONTENT_KEY).pipe(Effect.catch(() => Effect.void));
    const idempotentMessage =
      prevState.lastDeploymentId
        ? `No changes — last deploy ${prevState.lastDeploymentId} still represents this content.`
        : 'No changes — content already saved.';
    return redirect(
      `/admin?status=${encodeURIComponent(idempotentMessage)}&published=1${prevState.lastDeploymentId ? `&deploy=${encodeURIComponent(prevState.lastDeploymentId)}` : ''}`,
    );
  }

  // Best-effort concurrency guard: if another publish is in flight (within
  // IN_FLIGHT_TIMEOUT_MS), reject. Past the timeout we assume that publish
  // crashed and let this one proceed.
  if (
    prevState &&
    prevState.inFlight &&
    now - prevState.inFlight.startedAt < IN_FLIGHT_TIMEOUT_MS
  ) {
    const result: ActionResult = {
      ok: false,
      error:
        'Another publish is already in flight (started <90s ago). Wait for it to finish, then retry.',
      fieldErrors: {},
    };
    return Response.json(result, { status: 409 });
  }

  // Mark publish as in-flight before we touch anything else. If we crash
  // between here and the final state write, the next publish past the
  // timeout window converges.
  const inFlightState: PublishState = {
    contentHash: prevState?.contentHash ?? null,
    lastDeploymentId: prevState?.lastDeploymentId ?? null,
    lastPublishedAt: prevState?.lastPublishedAt ?? null,
    inFlight: { hash: newHash, startedAt: now },
  };
  yield* storage.put(
    PUBLISH_STATE_KEY,
    encodePublishState(inFlightState),
    'application/json',
  );

  // Write content. Build will pick this up on the next deploy.
  const json = JSON.stringify(content, null, 2);
  yield* storage.put(CONTENT_KEY, json, 'application/json');

  // Trigger redeploy. If Railway isn't configured, treat as save-only.
  const deployExit = yield* Effect.exit(railway.triggerDeploy);
  let deploymentId: string | null = null;
  let message: string;
  let published = false;
  if (deployExit._tag === 'Success') {
    deploymentId = deployExit.value.deploymentId;
    published = true;
    message = `Saved and deploy ${deploymentId} queued. New site live in ~60s.`;
  } else {
    let detail = 'unknown error';
    for (const reason of deployExit.cause.reasons) {
      if (Cause.isFailReason(reason)) {
        const err = reason.error as unknown;
        if (Schema.is(RailwayDisabled)(err)) {
          detail = 'Railway not configured — no redeploy.';
        } else if (Schema.is(RailwayError)(err)) {
          detail = `redeploy failed: ${err.message}`;
        }
      }
    }
    message = `Saved to bucket. ${detail}`;
  }

  // Final state: only stamp contentHash if Railway succeeded OR Railway is
  // disabled. If Railway errored we keep prevState.contentHash so the editor
  // can retry; clearing inFlight either way unblocks the next publish.
  const railwaySucceededOrDisabled =
    deployExit._tag === 'Success' ||
    (deployExit._tag === 'Failure' &&
      [...deployExit.cause.reasons].some(
        (r) =>
          Cause.isFailReason(r) &&
          Schema.is(RailwayDisabled)(r.error as unknown),
      ));

  const finalState: PublishState = {
    contentHash: railwaySucceededOrDisabled
      ? newHash
      : (prevState?.contentHash ?? null),
    lastDeploymentId: deploymentId ?? prevState?.lastDeploymentId ?? null,
    lastPublishedAt: railwaySucceededOrDisabled
      ? now
      : (prevState?.lastPublishedAt ?? null),
    inFlight: null,
  };
  yield* storage.put(
    PUBLISH_STATE_KEY,
    encodePublishState(finalState),
    'application/json',
  );
  yield* storage.delete(DRAFT_CONTENT_KEY).pipe(Effect.catch(() => Effect.void));

  const params = new URLSearchParams({
    status: message,
    published: published ? '1' : '0',
  });
  if (deploymentId) params.set('deploy', deploymentId);
  return redirect(`/admin?${params.toString()}`);
});

function StatusBanner({ search }: { search: URLSearchParams }) {
  const status = search.get('status');
  const published = search.get('published') === '1';
  const deploy = search.get('deploy');
  if (status === null) return null;
  return (
    <div
      className={`rounded-md border p-3 text-sm ${
        published
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      {status}
      {deploy && (
        <span className="ml-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs">
          deploy {deploy}
        </span>
      )}
    </div>
  );
}

function DraftBanner({
  draftLastModified,
  submitting,
}: {
  readonly draftLastModified: number | null;
  readonly submitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <p>
        You're viewing an unpublished draft.
        {draftLastModified !== null && (
          <>
            {' '}
            Last saved{' '}
            <span className="font-mono">
              {DateTime.formatIso(DateTime.makeUnsafe(draftLastModified))}
            </span>
            .
          </>
        )}
      </p>
      <Form method="post">
        <input type="hidden" name="intent" value="discard-draft" />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={submitting}
          className="bg-white"
        >
          Discard draft
        </Button>
      </Form>
    </div>
  );
}

function ImageUploadForm({ submitting }: { readonly submitting: boolean }) {
  return (
    <Form
      method="post"
      encType="multipart/form-data"
      className="rounded-md border border-neutral-200 bg-white p-4"
    >
      <input type="hidden" name="intent" value="upload-image" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <label
            htmlFor="admin-image-upload"
            className="block text-sm font-medium text-neutral-900"
          >
            Image upload
          </label>
          <p className="text-xs text-neutral-500">
            Converts to WebP up to {ADMIN_IMAGE_UPLOAD_MAX_EDGE}px and writes a thumbnail.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="admin-image-upload"
            type="file"
            name="file"
            accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
            required
            className="cursor-pointer sm:max-w-[22rem]"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            <Upload className="size-4" aria-hidden />
            Upload image
          </Button>
        </div>
      </div>
    </Form>
  );
}

function renderSection({
  section,
  content,
  assetOptions,
}: {
  readonly section: SectionKey;
  readonly content: SiteContent;
  readonly assetOptions: readonly AssetOption[];
}) {
  switch (section) {
    case 'meta':
      return <MetaSection name={section} defaultValue={content.meta} assets={assetOptions} />;
    case 'header':
      return (
        <HeaderSection name={section} defaultValue={content.header} assets={assetOptions} />
      );
    case 'hero':
      return <HeroSection name={section} defaultValue={content.hero} assets={assetOptions} />;
    case 'about':
      return (
        <AboutSection name={section} defaultValue={content.about} assets={assetOptions} />
      );
    case 'menu':
      return <MenuSection name={section} defaultValue={content.menu} assets={assetOptions} />;
    case 'menuPdf':
      return <MenuPdfSection name="menu" defaultValue={content.menu} assets={assetOptions} />;
    case 'location':
      return (
        <LocationSection
          name={section}
          defaultValue={content.location}
          assets={assetOptions}
        />
      );
    case 'contact':
      return (
        <ContactSection
          name={section}
          defaultValue={content.contact}
          assets={assetOptions}
        />
      );
    case 'footer':
      return (
        <FooterSection name={section} defaultValue={content.footer} assets={assetOptions} />
      );
    case 'jsonLd':
      return (
        <JsonLdSection
          name={section}
          defaultValue={content.jsonLd}
          assets={assetOptions}
        />
      );
  }
}

const sectionLabels: Record<SectionKey, string> = {
  meta: 'meta',
  header: 'header',
  hero: 'hero',
  about: 'about',
  menu: 'menu carousel',
  menuPdf: 'menu PDF',
  location: 'location',
  contact: 'contact',
  footer: 'footer',
  jsonLd: 'jsonLd',
};

export default function AdminContent() {
  const {
    content,
    contentSource,
    draftLastModified,
    assetOptions,
    assetListFailed,
    isUsingDefaults,
    railwayEnabled,
    lastDeploymentId,
    lastPublishedAt,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionResult>();
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';

  const search =
    typeof window === 'undefined'
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);

  const fieldErrors: FieldErrors =
    actionData && !actionData.ok ? actionData.fieldErrors : {};

  const detailsRefs = useRef<Partial<Record<SectionKey, HTMLDetailsElement>>>({});

  // After a failed save, scroll the first invalid section into view.
  useEffect(() => {
    if (!actionData || actionData.ok) return;
    const firstBroken = SECTIONS.find((k) => fieldErrors[k]?.length);
    if (!firstBroken) return;
    const details = detailsRefs.current[firstBroken];
    if (details) {
      details.open = true;
      details.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [actionData, fieldErrors]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Site content</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Edit bilingual copy, structured references, and image assets. Drafts
          stay private to admin; publishing writes the live content and can
          trigger a Railway redeploy.
        </p>
        {isUsingDefaults && (
          <p className="mt-2 inline-block rounded bg-sky-50 px-2 py-1 text-xs text-sky-800">
            Currently serving bundled defaults — no <code>content/site.json</code>{' '}
            in bucket yet.
          </p>
        )}
        {!railwayEnabled && (
          <p className="mt-2 inline-block rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
            Railway redeploy not configured. Saving will write the bucket only.
          </p>
        )}
        {assetListFailed && (
          <p className="mt-2 inline-block rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
            Bucket asset listing failed. Image pickers are showing managed
            fallback assets.
          </p>
        )}
        {lastDeploymentId && (
          <p className="mt-2 text-xs text-neutral-500">
            Last deploy:{' '}
            <span className="font-mono text-neutral-700">{lastDeploymentId}</span>
            {lastPublishedAt && (
              <>
                {' '}
                at{' '}
                <span className="font-mono text-neutral-700">
                  {DateTime.formatIso(DateTime.makeUnsafe(lastPublishedAt))}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <StatusBanner search={search} />

      {contentSource === 'draft' && (
        <DraftBanner draftLastModified={draftLastModified} submitting={submitting} />
      )}

      {actionData && !actionData.ok && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <strong>Save failed:</strong> {actionData.error}
        </div>
      )}

      <ImageUploadForm submitting={submitting} />

      <Form
        id={MENU_PDF_UPLOAD_FORM_ID}
        method="post"
        encType="multipart/form-data"
        className="hidden"
      >
        <input type="hidden" name="intent" value="upload-menu-pdf" />
      </Form>

      <Form method="post" className="space-y-4">
        {SECTIONS.map((key) => {
          const errors = fieldErrors[key];
          const hasError = !!errors?.length;
          const defaultOpen =
            key === 'meta' || key === 'header' || key === 'hero';
          return (
            <details
              key={key}
              ref={(el) => {
                if (el) detailsRefs.current[key] = el;
                else delete detailsRefs.current[key];
              }}
              open={hasError || defaultOpen}
              className={`rounded-lg border bg-white ${
                hasError ? 'border-rose-300' : 'border-neutral-200'
              }`}
            >
              <summary className="cursor-pointer list-none p-4 text-sm font-medium hover:bg-neutral-50">
                <span className="select-none text-neutral-500">▸</span>{' '}
                {sectionLabels[key]}
                {hasError && (
                  <span className="ml-2 inline-block rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-800">
                    {errors!.length} error{errors!.length === 1 ? '' : 's'}
                  </span>
                )}
              </summary>
              <div
                className="space-y-4 border-t border-neutral-200 p-4"
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? `${key}-errors` : undefined}
              >
                {renderSection({ section: key, content, assetOptions })}
                {hasError && (
                  <ul
                    id={`${key}-errors`}
                    className="mt-2 space-y-1 text-xs text-rose-800"
                  >
                    {errors!.map((msg, i) => (
                      <li key={i}>• {msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          );
        })}

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-neutral-200 bg-white/95 py-3 backdrop-blur">
          <p className="text-xs text-neutral-500">
            Draft writes <code>content/site.draft.json</code>. Publish writes{' '}
            <code>content/site.json</code>
            {railwayEnabled ? ' and triggers a Railway redeploy' : ''}.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              name="intent"
              value="save-draft"
              variant="outline"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button
              type="submit"
              name="intent"
              value="publish"
              disabled={submitting}
            >
              {submitting ? 'Publishing…' : 'Save & Publish'}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
