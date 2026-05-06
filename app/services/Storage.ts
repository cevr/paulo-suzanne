import { Config, Context, Effect, Layer, Redacted, Schema } from 'effect';

const StorageOp = Schema.Literals(['get', 'put', 'head']);
type StorageOp = typeof StorageOp.Type;

export class StorageError extends Schema.TaggedErrorClass<StorageError>()(
  '@paulo-suzanne/services/Storage/StorageError',
  {
    key: Schema.String,
    op: StorageOp,
    message: Schema.String,
  },
) {}

export class NotFound extends Schema.TaggedErrorClass<NotFound>()(
  '@paulo-suzanne/services/Storage/NotFound',
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
  }
>()('@paulo-suzanne/services/Storage') {
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
          Effect.tryPromise({
            try: async () => {
              const file = client.file(key);
              const stat = await file.stat();
              return {
                stream: file.stream(),
                contentType: stat.type ?? 'application/octet-stream',
                size: stat.size,
              };
            },
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
          }),

        put: (key, body, contentType) =>
          Effect.tryPromise({
            try: async () => {
              await client.write(key, body, { type: contentType });
            },
            catch: (e) =>
              new StorageError({ key, op: 'put' as const, message: String(e) }),
          }),

        head: (key) =>
          Effect.tryPromise({
            try: async (): Promise<ObjectHead | null> => {
              const file = client.file(key);
              const exists = await file.exists();
              if (!exists) return null;
              const stat = await file.stat();
              return {
                size: stat.size,
                contentType: stat.type ?? 'application/octet-stream',
                lastModified: stat.lastModified,
                etag: stat.etag,
              };
            },
            catch: (e) =>
              new StorageError({ key, op: 'head' as const, message: String(e) }),
          }),
      });
    }),
  );
}
