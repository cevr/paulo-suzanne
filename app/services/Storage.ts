import { Clock, Config, Context, DateTime, Effect, Layer, Option, Redacted, Schema } from 'effect';

const StorageOp = Schema.Literals(['get', 'put', 'head', 'list', 'delete']);
type StorageOp = typeof StorageOp.Type;

export class StorageError extends Schema.TaggedErrorClass<StorageError>()(
  'paulo-suzanne/services/Storage/StorageError',
  {
    key: Schema.String,
    op: StorageOp,
    message: Schema.String,
  },
) {}

export class NotFound extends Schema.TaggedErrorClass<NotFound>()(
  'paulo-suzanne/services/Storage/NotFound',
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

type ListClient = {
  readonly list: (input: {
    readonly prefix?: string;
    readonly continuationToken?: string;
  }) => Promise<{
    readonly contents?: readonly {
      readonly key: string;
      readonly size?: number;
      readonly lastModified?: string;
    }[];
    readonly nextContinuationToken?: string;
  }>;
};

const listStoredObjects = Effect.fn('listStoredObjects')(function* (
  client: ListClient,
  prefix: string | undefined,
) {
  const objects: ListedObject[] = [];
  let continuationToken: string | undefined;
  do {
    const page = yield* Effect.tryPromise(() =>
      client.list({
        prefix,
        continuationToken,
      }),
    );
    for (const item of page.contents ?? []) {
      objects.push({
        key: item.key,
        size: item.size ?? 0,
        lastModified:
          item.lastModified !== undefined
            ? DateTime.toDateUtc(DateTime.makeUnsafe(item.lastModified))
            : DateTime.toDateUtc(DateTime.makeUnsafe(0)),
      });
    }
    continuationToken = page.nextContinuationToken;
  } while (continuationToken !== undefined);
  return objects;
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
>()('paulo-suzanne/services/Storage') {
  static layerOptional = () =>
    Layer.unwrap(
      Effect.gen(function* () {
        const endpoint = yield* Config.option(Config.string('BUCKET_ENDPOINT'));
        const accessKey = yield* Config.option(Config.redacted('BUCKET_ACCESS_KEY'));
        const secretKey = yield* Config.option(Config.redacted('BUCKET_SECRET_KEY'));
        const bucket = yield* Config.option(Config.string('BUCKET_NAME'));
        return Option.isSome(endpoint) &&
          Option.isSome(accessKey) &&
          Option.isSome(secretKey) &&
          Option.isSome(bucket)
          ? Storage.layer
          : Storage.layerTest();
      }),
    );

  static layerTest = (objects: Record<string, TestStoredObject> = {}) =>
    Layer.sync(Storage, () => {
      const entries = new Map<string, Required<TestStoredObject>>();
      for (const [key, object] of Object.entries(objects)) {
        entries.set(key, {
          body: object.body,
          contentType: object.contentType ?? 'application/json',
          lastModified:
            object.lastModified ?? DateTime.toDateUtc(DateTime.makeUnsafe(0)),
          etag: object.etag ?? `"${key}"`,
        });
      }

      const bytes = (body: Uint8Array | string): Uint8Array =>
        typeof body === 'string' ? new TextEncoder().encode(body) : body;
      const responseBody = (body: Uint8Array | string): BodyInit =>
        typeof body === 'string'
          ? body
          : new Blob([body as Uint8Array<ArrayBuffer>]);

      return Storage.of({
        get: (key) => {
          const object = entries.get(key);
          if (object === undefined) return Effect.fail(new NotFound({ key }));
          return Effect.sync(() => ({
            stream: new Response(responseBody(object.body)).body ?? new ReadableStream(),
            contentType: object.contentType,
            size: bytes(object.body).byteLength,
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
              size: bytes(object.body).byteLength,
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
                size: bytes(object.body).byteLength,
                lastModified: object.lastModified,
              })),
          ),

        delete: (key) =>
          Effect.sync(() => {
            entries.delete(key);
          }),
      });
    });

  static layer = Layer.effect(
    Storage,
    Effect.gen(function* () {
      const endpoint = yield* Config.string('BUCKET_ENDPOINT');
      const accessKeyIdRedacted = yield* Config.redacted('BUCKET_ACCESS_KEY');
      const secretAccessKeyRedacted = yield* Config.redacted('BUCKET_SECRET_KEY');
      const bucket = yield* Config.string('BUCKET_NAME');
      const region = yield* Config.string('BUCKET_REGION').pipe(Config.withDefault('auto'));

      const client = new Bun.S3Client({
        endpoint,
        accessKeyId: Redacted.value(accessKeyIdRedacted),
        secretAccessKey: Redacted.value(secretAccessKeyRedacted),
        bucket,
        region,
      });

      return Storage.of({
        get: (key) =>
          Effect.gen(function* () {
            const file = client.file(key);
            const stat = yield* Effect.tryPromise({
              try: () => file.stat(),
              catch: (e) => {
                const msg = String(e);
                if (
                  msg.includes('NoSuchKey') ||
                  msg.includes('does not exist') ||
                  msg.includes('404')
                ) {
                  return new NotFound({ key });
                }
                return new StorageError({ key, op: 'get' as const, message: msg });
              },
            });
              return {
                stream: file.stream(),
                contentType: stat.type ?? 'application/octet-stream',
                size: stat.size,
              };
          }),

        put: (key, body, contentType) =>
          Effect.tryPromise({
            try: () => client.write(key, body, { type: contentType }),
            catch: (e) =>
              new StorageError({ key, op: 'put' as const, message: String(e) }),
          }),

        head: (key) =>
          Effect.gen(function* () {
            const file = client.file(key);
            const exists = yield* Effect.tryPromise({
              try: () => file.exists(),
              catch: (e) =>
                new StorageError({ key, op: 'head' as const, message: String(e) }),
            });
            if (!exists) return null;
            const stat = yield* Effect.tryPromise({
              try: () => file.stat(),
              catch: (e) =>
                new StorageError({ key, op: 'head' as const, message: String(e) }),
            });
            return {
              size: stat.size,
              contentType: stat.type ?? 'application/octet-stream',
              lastModified: stat.lastModified,
              etag: stat.etag,
            };
          }),

        list: (prefix) =>
          listStoredObjects(client, prefix).pipe(
            Effect.catchCause((cause) =>
              Effect.fail(
                new StorageError({
                  key: prefix ?? '',
                  op: 'list' as const,
                  message: String(cause),
                }),
              ),
            ),
          ),

        delete: (key) =>
          Effect.tryPromise({
            try: () => client.delete(key),
            catch: (e) =>
              new StorageError({
                key,
                op: 'delete' as const,
                message: String(e),
              }),
          }),
      });
    }),
  );
}
