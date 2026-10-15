/**
 * Image measuring and WebP encoding for admin uploads.
 *
 * The deployed Worker provides it from the Cloudflare Images binding
 * (`src/worker/adapters.ts`), so the Worker spends no CPU on pixels. The dev
 * server and tests provide `layerBun`, which uses `Bun.Image`.
 */
import { Context, Effect, Layer, Schema } from "effect";

export class ImageProcessingError extends Schema.TaggedError<
  ImageProcessingError,
  { readonly brand: unique symbol }
>()("paulo-suzanne/services/ImageProcessor/ImageProcessingError", { message: Schema.String }) {}

export interface ImageSize {
  readonly width: number;
  readonly height: number;
}

export interface WebpOptions {
  /** The longest edge of the output. A smaller image is never enlarged. */
  readonly maxEdge: number;
  readonly quality: number;
}

export class ImageProcessor extends Context.Service<
  ImageProcessor,
  {
    readonly measure: (bytes: Uint8Array) => Effect.Effect<ImageSize, ImageProcessingError>;
    readonly toWebp: (
      bytes: Uint8Array,
      options: WebpOptions,
    ) => Effect.Effect<Uint8Array, ImageProcessingError>;
  }
>()("paulo-suzanne/services/ImageProcessor") {
  static layerBun = Layer.sync(ImageProcessor, () => {
    const attempt = <A>(run: () => Promise<A>) =>
      Effect.tryPromise({
        try: run,
        catch: (error) => ImageProcessingError.make({ message: String(error) }),
      });
    return ImageProcessor.of({
      measure: (bytes) => attempt(() => new Bun.Image(bytes).metadata()),
      toWebp: (bytes, { maxEdge, quality }) =>
        attempt(() =>
          new Bun.Image(bytes)
            .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
            .webp({ quality })
            .bytes(),
        ),
    });
  });
}
