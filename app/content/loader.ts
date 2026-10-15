import { Config, Context, Effect, Layer, Option, Schema } from "effect";

import type { NotFound, StorageError } from "~/services/Storage";
import { Storage } from "~/services/Storage";
import { isRetiredAssetKey, MENU_PDF_PUBLIC_HREF } from "~/lib/managed-assets";

import { defaultContent } from "./defaults";
import { SiteContent } from "./schema";

const CONTENT_KEY = "content/site.json";
const DRAFT_CONTENT_KEY = "content/site.draft.json";

const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(SiteContent));

export class ContentLoadError extends Schema.TaggedError<
  ContentLoadError,
  { readonly brand: unique symbol }
>()("paulo-suzanne/content/loader/ContentLoadError", { message: Schema.String }) {}

export type AdminContentLoad = {
  readonly content: SiteContent;
  readonly source: "draft" | "published" | "defaults";
  readonly draftLastModified: number | null;
};

const allowDefaultContent = Effect.gen(function* () {
  const value = yield* Config.option(Config.String("ALLOW_DEFAULT_CONTENT"));
  return Option.isSome(value) && value.value === "1";
});

const decodeContentText = Effect.fn("decodeContentText")(function* (key: string, text: string) {
  return yield* decode(text).pipe(
    Effect.catchCause((cause) =>
      Effect.fail(
        ContentLoadError.make({
          message: `[content] failed to decode ${key} — refusing to ship defaults. Cause: ${String(cause)}`,
        }),
      ),
    ),
  );
});

const readContentFromStorage = Effect.fn("readContentFromStorage")(function* (key: string) {
  const storage = yield* Storage;
  const head = yield* storage.head(key);
  if (head === null) return Option.none();
  const object = yield* storage.get(key);
  const text = yield* Effect.tryPromise({
    try: () => new Response(object.stream).text(),
    catch: (e) =>
      ContentLoadError.make({
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
 * Public content loader: the published `content/site.json`.
 *
 * Strict mode is the default: a missing key, a read error or a decode error
 * fails the request rather than silently showing defaults over published
 * content. Set ALLOW_DEFAULT_CONTENT=1 in the dev server's environment to
 * permit the bundled defaults. The deployed Worker never binds it.
 */
const loadContentFromStorage = Effect.fn("loadContentFromStorage")(function* () {
  const allowDefaults = yield* allowDefaultContent;

  const fallbackOrThrow = (reason: string): Effect.Effect<SiteContent, ContentLoadError> => {
    if (allowDefaults) {
      return Effect.logInfo(
        `[content] ${reason} — using bundled defaults (ALLOW_DEFAULT_CONTENT=1)`,
      ).pipe(Effect.as(defaultContent));
    }
    return Effect.fail(
      ContentLoadError.make({
        message: `[content] ${reason} — refusing to ship defaults. Set ALLOW_DEFAULT_CONTENT=1 to opt in (dev/bootstrap only).`,
      }),
    );
  };

  const published = yield* readContentFromStorage(CONTENT_KEY).pipe(
    Effect.mapError((error) =>
      ContentLoadError.make({
        message: `[content] bucket read failed for ${CONTENT_KEY} — refusing to ship defaults. Cause: ${String(error)}`,
      }),
    ),
  );

  if (Option.isNone(published)) {
    return yield* fallbackOrThrow(`no ${CONTENT_KEY} in bucket`);
  }

  return published.value.content;
});

const loadAdminContentFromStorage = Effect.fn("loadAdminContentFromStorage")(function* () {
  const allowDefaults = yield* allowDefaultContent;
  const draft = yield* readContentFromStorage(DRAFT_CONTENT_KEY);
  if (Option.isSome(draft)) {
    return {
      content: draft.value.content,
      source: "draft" as const,
      draftLastModified: draft.value.lastModified,
    };
  }

  const published = yield* readContentFromStorage(CONTENT_KEY);
  if (Option.isSome(published)) {
    return {
      content: published.value.content,
      source: "published" as const,
      draftLastModified: null,
    };
  }

  if (allowDefaults) {
    yield* Effect.logInfo(
      `[content] no ${CONTENT_KEY} in bucket — using bundled defaults (ALLOW_DEFAULT_CONTENT=1)`,
    );
    return {
      content: defaultContent,
      source: "defaults" as const,
      draftLastModified: null,
    };
  }

  return yield* ContentLoadError.make({
    message: `[content] no ${CONTENT_KEY} in bucket — refusing to ship defaults. Set ALLOW_DEFAULT_CONTENT=1 to opt in (dev/bootstrap only).`,
  });
});

export class Content extends Context.Service<
  Content,
  {
    readonly loadContent: Effect.Effect<SiteContent, Config.ConfigError | ContentLoadError>;
    readonly loadAdminContent: Effect.Effect<
      AdminContentLoad,
      Config.ConfigError | ContentLoadError | NotFound | StorageError
    >;
  }
>()("paulo-suzanne/content/loader/Content") {
  /** Content read from the given storage. */
  static make = (storage: Storage["Service"]) =>
    Content.of({
      loadContent: loadContentFromStorage().pipe(Effect.provideService(Storage, storage)),
      loadAdminContent: loadAdminContentFromStorage().pipe(Effect.provideService(Storage, storage)),
    });

  static layer = Layer.effect(
    Content,
    Effect.gen(function* () {
      return Content.make(yield* Storage);
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
  const visibleCarousel = content.menu.carousel.filter(
    (item) => !isRetiredAssetKey(item.image.key),
  );
  const [firstVisibleItem, ...remainingVisibleItems] = visibleCarousel;

  return {
    ...content,
    menu: {
      ...content.menu,
      carousel:
        firstVisibleItem === undefined
          ? defaultContent.menu.carousel
          : [firstVisibleItem, ...remainingVisibleItems],
      pdfHref: MENU_PDF_PUBLIC_HREF,
    },
    jsonLd: {
      ...content.jsonLd,
      imageKey: content.meta.ogImage.key,
      menuPath: MENU_PDF_PUBLIC_HREF,
    },
  };
}
