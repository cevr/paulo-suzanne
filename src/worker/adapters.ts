/**
 * The app's services, made from the Worker's bindings for one request.
 *
 * Every binding call needs the context of the request it serves, while the
 * app's services need nothing (`app/lib/effect/runtime.ts`). So each adapter
 * takes the request's whole context and provides it to every call. The whole
 * context, not only `RuntimeContext`: the cache purge also reads the request's
 * execution context from it, which its type does not say.
 */
import type { RuntimeContext } from "alchemy";
import type * as Cloudflare from "@alchemy.run/cloudflare";
import { Array as Arr, Effect, Option, Stream, type Context } from "effect";

import { ImageProcessingError, ImageProcessor } from "~/services/ImageProcessor";
import { SITE_CACHE_TAG, SiteCache, SiteCachePurgeError } from "~/services/SiteCache";
import {
  contentTypeFor,
  NotFound,
  Storage,
  StorageError,
  type ListedObject,
} from "~/services/Storage";

type Request = Context.Context<RuntimeContext>;

const inRequest =
  (request: Request) =>
  <A, E>(effect: Effect.Effect<A, E, RuntimeContext>): Effect.Effect<A, E> =>
    Effect.provideContext(effect, request);

const storageError = (key: string, op: StorageError["op"]) => (error: { message: string }) =>
  StorageError.make({ key, op, message: error.message });

const listAll = Effect.fn("Storage.listAll")(function* (
  bucket: Cloudflare.R2.ReadWriteBucketClient,
  prefix: Option.Option<string>,
) {
  const listed: ListedObject[] = [];
  let cursor = Option.none<string>();
  do {
    const page = yield* bucket.list({
      prefix: Option.getOrUndefined(prefix),
      cursor: Option.getOrUndefined(cursor),
    });
    for (const object of page.objects) {
      listed.push({ key: object.key, size: object.size, lastModified: object.uploaded });
    }
    cursor = Option.liftPredicate(page, (p) => p.truncated).pipe(
      Option.flatMap((p) => Option.fromNullishOr(p.cursor)),
    );
  } while (Option.isSome(cursor));
  return listed;
});

const contentTypeOf = (key: string, object: Cloudflare.R2.R2Object) =>
  Option.fromNullishOr(object.httpMetadata?.contentType).pipe(
    Option.getOrElse(() => contentTypeFor(key)),
  );

export const storageFromR2 = (bucket: Cloudflare.R2.ReadWriteBucketClient, request: Request) => {
  const run = inRequest(request);
  return Storage.of({
    get: (key) =>
      run(bucket.get(key)).pipe(
        Effect.mapError(storageError(key, "get")),
        Effect.flatMap((found) =>
          Option.match(Option.fromNullishOr(found), {
            onNone: () => Effect.fail(NotFound.make({ key })),
            onSome: (object) =>
              Effect.succeed({
                stream: Option.fromNullishOr(object.readable).pipe(
                  Option.getOrElse(() => Stream.toReadableStream(object.body)),
                ),
                contentType: contentTypeOf(key, object),
                size: object.size,
              }),
          }),
        ),
      ),

    put: (key, body, contentType) =>
      run(bucket.put(key, body, { httpMetadata: { contentType } })).pipe(
        Effect.mapError(storageError(key, "put")),
        Effect.asVoid,
      ),

    head: (key) =>
      run(bucket.head(key)).pipe(
        Effect.mapError(storageError(key, "head")),
        Effect.map((found) =>
          Option.fromNullishOr(found).pipe(
            Option.map((object) => ({
              size: object.size,
              contentType: contentTypeOf(key, object),
              lastModified: object.uploaded,
              etag: object.httpEtag,
            })),
            // The app's Storage contract says "absent" with null.
            Option.getOrNull,
          ),
        ),
      ),

    list: (prefix) =>
      run(listAll(bucket, Option.fromNullishOr(prefix))).pipe(
        Effect.mapError(
          storageError(
            Option.getOrElse(Option.fromNullishOr(prefix), () => ""),
            "list",
          ),
        ),
      ),

    delete: (key) => run(bucket.delete(key)).pipe(Effect.mapError(storageError(key, "delete"))),
  });
};

const imageError = (error: { message: string }) =>
  ImageProcessingError.make({ message: error.message });

export const imagesFromBinding = (images: Cloudflare.Images.ImagesClient, request: Request) => {
  const run = inRequest(request);
  return ImageProcessor.of({
    measure: (bytes) =>
      run(images.info(Stream.make(bytes))).pipe(
        Effect.mapError(imageError),
        Effect.flatMap((info) => {
          if (!("width" in info)) {
            return Effect.fail(
              ImageProcessingError.make({ message: `Unsupported image: ${info.format}` }),
            );
          }
          return Effect.succeed({ width: info.width, height: info.height });
        }),
      ),

    toWebp: (bytes, { maxEdge, quality }) =>
      Effect.gen(function* () {
        const transformer = yield* run(images.input(Stream.make(bytes)));
        const result = yield* transformer
          .transform({ width: maxEdge, height: maxEdge, fit: "scale-down" })
          .output({ format: "image/webp", quality });
        const response = yield* result.response;
        const buffer = yield* Effect.tryPromise({
          try: () => response.arrayBuffer(),
          catch: (error) => ImageProcessingError.make({ message: String(error) }),
        });
        return new Uint8Array(buffer);
      }).pipe(Effect.catchTag("ImagesError", (error) => Effect.fail(imageError(error)))),
  });
};

export const siteCacheFromWorkersCache = (cache: Cloudflare.CacheClient, request: Request) => {
  const run = inRequest(request);
  return SiteCache.of({
    purge: run(cache.purge({ tags: [SITE_CACHE_TAG] })).pipe(
      Effect.mapError((error) => SiteCachePurgeError.make({ message: error.message })),
      Effect.flatMap((result) => {
        if (result.success) return Effect.void;
        const message = Arr.join(
          Arr.map(result.errors, (error) => error.message),
          "; ",
        );
        return Effect.fail(SiteCachePurgeError.make({ message }));
      }),
    ),
  });
};
