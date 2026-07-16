import { Config, Context, Effect, Layer, ManagedRuntime, Option, Schema } from 'effect';

import { NotFound, Storage, StorageError } from '~/services/Storage';
import { MENU_PDF_PUBLIC_HREF } from '~/lib/managed-assets';

import { defaultContent } from './defaults';
import { SiteContent } from './schema';

const CONTENT_KEY = 'content/site.json';
const DRAFT_CONTENT_KEY = 'content/site.draft.json';

const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(SiteContent));

export class ContentLoadError extends Schema.TaggedErrorClass<ContentLoadError>()(
  'paulo-suzanne/content/loader/ContentLoadError',
  { message: Schema.String },
) {}

type BucketConfig = {
  readonly endpoint: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
  readonly region: string;
};

type ContentFile = {
  readonly exists: () => Promise<boolean>;
  readonly text: () => Promise<string>;
  readonly stat: () => Promise<{ readonly lastModified: Date }>;
};

type ContentClient = {
  readonly file: (key: string) => ContentFile;
};

export type AdminContentLoad = {
  readonly content: SiteContent;
  readonly source: 'draft' | 'published' | 'defaults';
  readonly draftLastModified: number | null;
};

const allowDefaultContent = Effect.gen(function* () {
  const value = yield* Config.option(Config.string('ALLOW_DEFAULT_CONTENT'));
  return Option.isSome(value) && value.value === '1';
});

const bucketConfig = Effect.gen(function* () {
  const endpoint = yield* Config.option(Config.string('BUCKET_ENDPOINT'));
  const accessKeyId = yield* Config.option(Config.string('BUCKET_ACCESS_KEY'));
  const secretAccessKey = yield* Config.option(Config.string('BUCKET_SECRET_KEY'));
  const bucket = yield* Config.option(Config.string('BUCKET_NAME'));
  const region = yield* Config.string('BUCKET_REGION').pipe(Config.withDefault('auto'));

  if (
    Option.isNone(endpoint) ||
    Option.isNone(accessKeyId) ||
    Option.isNone(secretAccessKey) ||
    Option.isNone(bucket)
  ) {
    return Option.none<BucketConfig>();
  }

  return Option.some({
    endpoint: endpoint.value,
    accessKeyId: accessKeyId.value,
    secretAccessKey: secretAccessKey.value,
    bucket: bucket.value,
    region,
  });
});

const clientFromConfig = (config: BucketConfig): ContentClient =>
  new Bun.S3Client(config);

const decodeContentText = Effect.fn('decodeContentText')(function* (
  key: string,
  text: string,
) {
  return yield* decode(text).pipe(
    Effect.catchCause((cause) =>
      Effect.fail(
        new ContentLoadError({
          message: `[content] failed to decode ${key} — refusing to ship defaults. Cause: ${String(cause)}`,
        }),
      ),
    ),
  );
});

const readContentFile = Effect.fn('readContentFile')(function* (
  client: ContentClient,
  key: string,
) {
  const file = client.file(key);
  const exists = yield* Effect.tryPromise({
    try: () => file.exists(),
    catch: (e) =>
      new ContentLoadError({
        message: `[content] S3 exists() failed for ${key} — refusing to ship defaults. Cause: ${String(e)}`,
      }),
  });

  if (!exists) return Option.none();

  const stat = yield* Effect.tryPromise({
    try: () => file.stat(),
    catch: (e) =>
      new ContentLoadError({
        message: `[content] S3 read failed for ${key} — refusing to ship defaults. Cause: ${String(e)}`,
      }),
  });
  const text = yield* Effect.tryPromise({
    try: () => file.text(),
    catch: (e) =>
      new ContentLoadError({
        message: `[content] S3 read failed for ${key} — refusing to ship defaults. Cause: ${String(e)}`,
      }),
  });

  const content = yield* decodeContentText(key, text);
  return Option.some({
    content,
    lastModified: stat.lastModified.getTime(),
  });
});

const readContentFromStorage = Effect.fn('readContentFromStorage')(function* (
  key: string,
) {
  const storage = yield* Storage;
  const head = yield* storage.head(key);
  if (head === null) return Option.none();
  const object = yield* storage.get(key);
  const text = yield* Effect.tryPromise({
    try: () => new Response(object.stream).text(),
    catch: (e) =>
      new ContentLoadError({
        message: `[content] S3 stream read failed for ${key} — refusing to ship defaults. Cause: ${String(e)}`,
      }),
  });
  const content = yield* decodeContentText(key, text);
  return Option.some({
    content,
    lastModified: head.lastModified.getTime(),
  });
});

/**
 * Build-time content loader.
 *
 * Strict mode is the default. Set ALLOW_DEFAULT_CONTENT=1 (dev / bootstrap) to
 * permit the bundled defaults fallback. In prod we want any of these to FAIL
 * THE BUILD rather than silently ship defaults over previously-published
 * content (`make-operations-idempotent`, `prove-it-works`):
 *   - bucket env missing
 *   - bucket key absent
 *   - S3 read error
 *   - decode error
 *
 * The first-deploy bootstrap problem (no key in bucket yet) is solved by
 * setting ALLOW_DEFAULT_CONTENT=1 for that deploy only, then unsetting it.
 */
const loadContentFromBucket = Effect.fn('loadContentFromBucket')(function* () {
  const allowDefaults = yield* allowDefaultContent;
  const config = yield* bucketConfig;

  const fallbackOrThrow = (
    reason: string,
  ): Effect.Effect<SiteContent, ContentLoadError> => {
    if (allowDefaults) {
      return Effect.logInfo(
        `[content] ${reason} — using bundled defaults (ALLOW_DEFAULT_CONTENT=1)`,
      ).pipe(Effect.as(defaultContent));
    }
    return Effect.fail(
      new ContentLoadError({
        message: `[content] ${reason} — refusing to ship defaults. Set ALLOW_DEFAULT_CONTENT=1 to opt in (dev/bootstrap only).`,
      }),
    );
  };

  if (Option.isNone(config)) {
    return yield* fallbackOrThrow('bucket env not set');
  }

  const client = clientFromConfig(config.value);
  const published = yield* readContentFile(client, CONTENT_KEY);

  if (Option.isNone(published)) {
    return yield* fallbackOrThrow(`no ${CONTENT_KEY} in bucket`);
  }

  return published.value.content;
});

const loadAdminContentFromStorage = Effect.fn(
  'loadAdminContentFromStorage',
)(function* () {
  const allowDefaults = yield* allowDefaultContent;
  const draft = yield* readContentFromStorage(DRAFT_CONTENT_KEY);
  if (Option.isSome(draft)) {
    return {
      content: draft.value.content,
      source: 'draft' as const,
      draftLastModified: draft.value.lastModified,
    };
  }

  const published = yield* readContentFromStorage(CONTENT_KEY);
  if (Option.isSome(published)) {
    return {
      content: published.value.content,
      source: 'published' as const,
      draftLastModified: null,
    };
  }

  if (allowDefaults) {
    yield* Effect.logInfo(
      `[content] no ${CONTENT_KEY} in bucket — using bundled defaults (ALLOW_DEFAULT_CONTENT=1)`,
    );
    return {
      content: defaultContent,
      source: 'defaults' as const,
      draftLastModified: null,
    };
  }

  return yield* new ContentLoadError({
    message: `[content] no ${CONTENT_KEY} in bucket — refusing to ship defaults. Set ALLOW_DEFAULT_CONTENT=1 to opt in (dev/bootstrap only).`,
  });
});

export class Content extends Context.Service<
  Content,
  {
    readonly loadContent: Effect.Effect<
      SiteContent,
      Config.ConfigError | ContentLoadError
    >;
    readonly loadAdminContent: Effect.Effect<
      AdminContentLoad,
      Config.ConfigError | ContentLoadError | NotFound | StorageError,
      Storage
    >;
  }
>()('paulo-suzanne/content/loader/Content') {
  static layer = Layer.succeed(
    Content,
    Content.of({
      loadContent: loadContentFromBucket(),
      loadAdminContent: loadAdminContentFromStorage(),
    }),
  );
}

export const loadContent = Effect.gen(function* () {
  const content = yield* Content;
  return normalizeSiteContentAssets(yield* content.loadContent);
});

export const loadAdminContent = Effect.gen(function* () {
  const content = yield* Content;
  return yield* content.loadAdminContent;
});

export function normalizeSiteContentAssets(content: SiteContent): SiteContent {
  return {
    ...content,
    menu: { ...content.menu, pdfHref: MENU_PDF_PUBLIC_HREF },
    jsonLd: {
      ...content.jsonLd,
      imageKey: content.meta.ogImage.key,
      menuPath: MENU_PDF_PUBLIC_HREF,
    },
  };
}

const ContentRuntime = ManagedRuntime.make(Content.layer);

export const runLoadContent = (): Promise<SiteContent> =>
  ContentRuntime.runPromise(loadContent);
