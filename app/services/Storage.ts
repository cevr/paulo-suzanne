/**
 * The site's object storage: published and draft content, menu PDF and photos.
 *
 * The deployed Worker provides it from its R2 bucket (`src/worker/adapters.ts`).
 * The local dev server provides `layerDirectory`, and tests `layerTest`.
 */
import { Clock, Context, DateTime, Effect, FileSystem, Layer, Option, Schema } from "effect";

const StorageOp = Schema.Literals(["get", "put", "head", "list", "delete"]);
type StorageOp = typeof StorageOp.Type;

export class StorageError extends Schema.TaggedError<
  StorageError,
  { readonly brand: unique symbol }
>()("paulo-suzanne/services/Storage/StorageError", {
  key: Schema.String,
  op: StorageOp,
  message: Schema.String,
}) {}

export class NotFound extends Schema.TaggedError<NotFound, { readonly brand: unique symbol }>()(
  "paulo-suzanne/services/Storage/NotFound",
  { key: Schema.String },
) {}

export interface StoredObject {
  readonly stream: ReadableStream<Uint8Array>;
  readonly contentType: string;
  readonly size: number;
}

export interface ObjectHead {
  readonly size: number;
  readonly contentType: string;
  readonly lastModified: Date;
  readonly etag: string;
}

export interface ListedObject {
  readonly key: string;
  readonly size: number;
  readonly lastModified: Date;
}

export interface TestStoredObject {
  readonly body: Uint8Array | string;
  readonly contentType?: string;
  readonly lastModified?: Date;
  readonly etag?: string;
}

const CONTENT_TYPES: Record<string, string> = {
  avif: "image/avif",
  css: "text/css",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
  woff2: "font/woff2",
};

/** The content type a key's extension names, for stores that keep none. */
export const contentTypeFor = (key: string): string =>
  CONTENT_TYPES[key.slice(key.lastIndexOf(".") + 1).toLowerCase()] ?? "application/octet-stream";

const bytesOf = (body: Uint8Array | string): Uint8Array =>
  typeof body === "string" ? new TextEncoder().encode(body) : body;

const streamOf = (bytes: Uint8Array): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

export class Storage extends Context.Service<
  Storage,
  {
    readonly get: (key: string) => Effect.Effect<StoredObject, StorageError | NotFound>;
    readonly put: (
      key: string,
      body: Uint8Array | string,
      contentType: string,
    ) => Effect.Effect<void, StorageError>;
    readonly head: (key: string) => Effect.Effect<ObjectHead | null, StorageError>;
    readonly list: (prefix?: string) => Effect.Effect<readonly ListedObject[], StorageError>;
    readonly delete: (key: string) => Effect.Effect<void, StorageError>;
  }
>()("paulo-suzanne/services/Storage") {
  static layerTest = (objects: Record<string, TestStoredObject> = {}) =>
    Layer.sync(Storage, () => {
      const entries = new Map<string, Required<TestStoredObject>>();
      for (const [key, object] of Object.entries(objects)) {
        entries.set(key, {
          body: object.body,
          contentType: object.contentType ?? "application/json",
          lastModified: object.lastModified ?? DateTime.toDateUtc(DateTime.makeUnsafe(0)),
          etag: object.etag ?? `"${key}"`,
        });
      }

      return Storage.of({
        get: (key) => {
          const object = entries.get(key);
          if (object === undefined) return Effect.fail(NotFound.make({ key }));
          return Effect.sync(() => ({
            stream: streamOf(bytesOf(object.body)),
            contentType: object.contentType,
            size: bytesOf(object.body).byteLength,
          }));
        },

        put: (key, body, contentType) =>
          Effect.gen(function* () {
            const now = yield* Clock.currentTimeMillis;
            entries.set(key, {
              body,
              contentType,
              lastModified: DateTime.toDateUtc(DateTime.makeUnsafe(now)),
              etag: `"test-${now}"`,
            });
          }),

        head: (key) =>
          Effect.sync(() => {
            const object = entries.get(key);
            if (object === undefined) return null;
            return {
              size: bytesOf(object.body).byteLength,
              contentType: object.contentType,
              lastModified: object.lastModified,
              etag: object.etag,
            };
          }),

        list: (prefix) =>
          Effect.sync(() =>
            [...entries.entries()]
              .filter(([key]) => prefix === undefined || key.startsWith(prefix))
              .map(([key, object]) => ({
                key,
                size: bytesOf(object.body).byteLength,
                lastModified: object.lastModified,
              })),
          ),

        delete: (key) =>
          Effect.sync(() => {
            entries.delete(key);
          }),
      });
    });

  /**
   * A local directory as the bucket, for the dev server. Content types come
   * from each key's extension.
   */
  static layerDirectory = (root: string) =>
    Layer.effect(
      Storage,
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const pathOf = (key: string) => `${root}/${key}`;
        const failure = (key: string, op: StorageOp) => (error: unknown) =>
          StorageError.make({ key, op, message: String(error) });
        const headOf = (key: string) =>
          fs.stat(pathOf(key)).pipe(
            Effect.map((info) => ({
              size: Number(info.size),
              contentType: contentTypeFor(key),
              lastModified: Option.getOrElse(info.mtime, () =>
                DateTime.toDateUtc(DateTime.makeUnsafe(0)),
              ),
              etag: `"${key}"`,
            })),
          );

        return Storage.of({
          get: (key) =>
            Effect.gen(function* () {
              const exists = yield* fs
                .exists(pathOf(key))
                .pipe(Effect.mapError(failure(key, "get")));
              if (!exists) return yield* NotFound.make({ key });
              const bytes = yield* fs
                .readFile(pathOf(key))
                .pipe(Effect.mapError(failure(key, "get")));
              return {
                stream: streamOf(bytes),
                contentType: contentTypeFor(key),
                size: bytes.byteLength,
              };
            }),

          put: (key, body) =>
            Effect.gen(function* () {
              const path = pathOf(key);
              yield* fs.makeDirectory(path.slice(0, path.lastIndexOf("/")), { recursive: true });
              yield* fs.writeFile(path, bytesOf(body));
            }).pipe(Effect.mapError(failure(key, "put"))),

          head: (key) =>
            Effect.gen(function* () {
              const exists = yield* fs.exists(pathOf(key));
              if (!exists) return null;
              return yield* headOf(key);
            }).pipe(Effect.mapError(failure(key, "head"))),

          list: (prefix) =>
            Effect.gen(function* () {
              yield* fs.makeDirectory(root, { recursive: true });
              const keys = yield* fs.readDirectory(root, { recursive: true });
              const files = keys.filter(
                (key) => (prefix === undefined || key.startsWith(prefix)) && key.includes("."),
              );
              return yield* Effect.forEach(files, (key) =>
                headOf(key).pipe(
                  Effect.map((head) => ({ key, size: head.size, lastModified: head.lastModified })),
                ),
              );
            }).pipe(Effect.mapError(failure(prefix ?? "", "list"))),

          delete: (key) =>
            fs.remove(pathOf(key), { force: true }).pipe(Effect.mapError(failure(key, "delete"))),
        });
      }),
    );
}
