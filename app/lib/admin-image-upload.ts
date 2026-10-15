import { DateTime, Effect, Schema } from "effect";

import { ImageProcessor } from "~/services/ImageProcessor";
import { Storage, type StorageError } from "~/services/Storage";

export const ADMIN_IMAGE_UPLOAD_ACCEPT = "image/avif,image/gif,image/jpeg,image/png,image/webp";
export const ADMIN_IMAGE_UPLOAD_CONTENT_TYPE = "image/webp";
const ADMIN_IMAGE_UPLOAD_OUTPUT_EXTENSION = ".webp";
export const ADMIN_IMAGE_UPLOAD_PREFIX = "images/uploads";
export const ADMIN_IMAGE_UPLOAD_THUMBNAIL_MARKER = ".thumb";

const ACCEPTED_IMAGE_TYPES = new Set(
  ADMIN_IMAGE_UPLOAD_ACCEPT.split(",").map((type) => type.trim()),
);

export function isAcceptedAdminImageType(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.has(type);
}

export function thumbnailKeyForImage(key: string): string {
  const slashIndex = key.lastIndexOf("/");
  const dotIndex = key.lastIndexOf(".");
  if (dotIndex <= slashIndex) return `${key}${ADMIN_IMAGE_UPLOAD_THUMBNAIL_MARKER}`;
  return `${key.slice(0, dotIndex)}${ADMIN_IMAGE_UPLOAD_THUMBNAIL_MARKER}${key.slice(dotIndex)}`;
}

export const ADMIN_IMAGE_UPLOAD_MAX_EDGE = 2400;
export const ADMIN_IMAGE_UPLOAD_MAX_PIXELS = 40_000_000;
export const ADMIN_IMAGE_UPLOAD_QUALITY = 86;
export const ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE = 360;
export const ADMIN_IMAGE_UPLOAD_THUMBNAIL_QUALITY = 78;
type ProcessedAdminImage = {
  readonly key: string;
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly thumbnailKey: string;
  readonly thumbnailBytes: Uint8Array;
  readonly thumbnailWidth: number;
  readonly thumbnailHeight: number;
};

export class AdminImageUploadError extends Schema.TaggedError<
  AdminImageUploadError,
  { readonly brand: unique symbol }
>()("paulo-suzanne/lib/AdminImageUploadError", {
  message: Schema.String,
}) {}

function uploadKeyForImage(fileName: string, now: number): string {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const slug = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const stamp = DateTime.formatIso(DateTime.makeUnsafe(now)).replace(/[-:.]/g, "").slice(0, 15);
  return `${ADMIN_IMAGE_UPLOAD_PREFIX}/${slug || "image"}-${stamp}${ADMIN_IMAGE_UPLOAD_OUTPUT_EXTENSION}`;
}

function resizedDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { readonly width: number; readonly height: number } {
  const ratio = Math.min(1, maxEdge / width, maxEdge / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

const processAdminImageUpload = (
  file: File,
  now: number,
): Effect.Effect<ProcessedAdminImage, AdminImageUploadError, ImageProcessor> =>
  Effect.gen(function* () {
    const images = yield* ImageProcessor;
    const source = new Uint8Array(
      yield* Effect.tryPromise({
        try: () => file.arrayBuffer(),
        catch: (error) => AdminImageUploadError.make({ message: String(error) }),
      }),
    );
    const metadata = yield* images.measure(source);
    if (metadata.width * metadata.height > ADMIN_IMAGE_UPLOAD_MAX_PIXELS) {
      return yield* AdminImageUploadError.make({
        message: "This image is too large. Upload a photo under 40 megapixels.",
      });
    }
    const bytes = yield* images.toWebp(source, {
      maxEdge: ADMIN_IMAGE_UPLOAD_MAX_EDGE,
      quality: ADMIN_IMAGE_UPLOAD_QUALITY,
    });
    const thumbnailBytes = yield* images.toWebp(source, {
      maxEdge: ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE,
      quality: ADMIN_IMAGE_UPLOAD_THUMBNAIL_QUALITY,
    });
    const key = uploadKeyForImage(file.name, now);

    const imageDimensions = resizedDimensions(
      metadata.width,
      metadata.height,
      ADMIN_IMAGE_UPLOAD_MAX_EDGE,
    );
    const thumbnailDimensions = resizedDimensions(
      metadata.width,
      metadata.height,
      ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE,
    );

    return {
      key,
      bytes,
      ...imageDimensions,
      thumbnailKey: thumbnailKeyForImage(key),
      thumbnailBytes,
      thumbnailWidth: thumbnailDimensions.width,
      thumbnailHeight: thumbnailDimensions.height,
    };
  }).pipe(
    Effect.catchTag("paulo-suzanne/services/ImageProcessor/ImageProcessingError", (error) =>
      Effect.fail(AdminImageUploadError.make({ message: error.message })),
    ),
  );

export type IngestedAdminImage = Omit<ProcessedAdminImage, "bytes" | "thumbnailBytes">;

export const ingestAdminImage = (
  file: File,
  now: number,
): Effect.Effect<
  IngestedAdminImage,
  AdminImageUploadError | StorageError,
  ImageProcessor | Storage
> =>
  Effect.gen(function* () {
    if (file.size === 0) {
      return yield* AdminImageUploadError.make({
        message: "Choose an image before uploading.",
      });
    }
    if (!isAcceptedAdminImageType(file.type)) {
      return yield* AdminImageUploadError.make({
        message: "Upload a JPEG, PNG, WebP, GIF, or AVIF image.",
      });
    }

    const processed = yield* processAdminImageUpload(file, now);
    const storage = yield* Storage;
    yield* storage.put(processed.key, processed.bytes, ADMIN_IMAGE_UPLOAD_CONTENT_TYPE);
    yield* storage.put(
      processed.thumbnailKey,
      processed.thumbnailBytes,
      ADMIN_IMAGE_UPLOAD_CONTENT_TYPE,
    );

    return {
      key: processed.key,
      width: processed.width,
      height: processed.height,
      thumbnailKey: processed.thumbnailKey,
      thumbnailWidth: processed.thumbnailWidth,
      thumbnailHeight: processed.thumbnailHeight,
    };
  });
