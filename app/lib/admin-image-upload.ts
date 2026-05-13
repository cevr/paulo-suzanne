import { DateTime, Effect, Schema } from 'effect';

import {
  ADMIN_IMAGE_UPLOAD_OUTPUT_EXTENSION,
  ADMIN_IMAGE_UPLOAD_PREFIX,
  ADMIN_IMAGE_UPLOAD_THUMBNAIL_MARKER,
  thumbnailKeyForImage,
} from './uploaded-image-assets';

export const ADMIN_IMAGE_UPLOAD_MAX_EDGE = 2400;
export const ADMIN_IMAGE_UPLOAD_MAX_PIXELS = 40_000_000;
export const ADMIN_IMAGE_UPLOAD_QUALITY = 86;
export const ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE = 360;
export const ADMIN_IMAGE_UPLOAD_THUMBNAIL_QUALITY = 78;
export { ADMIN_IMAGE_UPLOAD_THUMBNAIL_MARKER, thumbnailKeyForImage };

export type ProcessedAdminImage = {
  readonly key: string;
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly thumbnailKey: string;
  readonly thumbnailBytes: Uint8Array;
  readonly thumbnailWidth: number;
  readonly thumbnailHeight: number;
};

export class AdminImageUploadError extends Schema.TaggedErrorClass<AdminImageUploadError>()(
  'paulo-suzanne/lib/AdminImageUploadError',
  {
    message: Schema.String,
  },
) {}

export function uploadKeyForImage(fileName: string, now: number): string {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const slug = baseName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  const stamp = DateTime.formatIso(DateTime.makeUnsafe(now))
    .replace(/[-:.]/g, '')
    .slice(0, 15);
  return `${ADMIN_IMAGE_UPLOAD_PREFIX}/${slug || 'image'}-${stamp}${ADMIN_IMAGE_UPLOAD_OUTPUT_EXTENSION}`;
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

const tryImage = <A>(promise: () => Promise<A>) =>
  Effect.tryPromise({
    try: promise,
    catch: (error) => new AdminImageUploadError({ message: String(error) }),
  });

export const processAdminImageUpload = (
  file: File,
  now: number,
): Effect.Effect<ProcessedAdminImage, AdminImageUploadError> =>
  Effect.gen(function* () {
    const source = new Bun.Image(file, { maxPixels: ADMIN_IMAGE_UPLOAD_MAX_PIXELS });
    const metadata = yield* tryImage(() => source.metadata());
    const key = uploadKeyForImage(file.name, now);
    const bytes = yield* tryImage(() =>
      new Bun.Image(file, { maxPixels: ADMIN_IMAGE_UPLOAD_MAX_PIXELS })
        .resize(ADMIN_IMAGE_UPLOAD_MAX_EDGE, ADMIN_IMAGE_UPLOAD_MAX_EDGE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: ADMIN_IMAGE_UPLOAD_QUALITY })
        .bytes(),
    );
    const thumbnailBytes = yield* tryImage(() =>
      new Bun.Image(file, {
        maxPixels: ADMIN_IMAGE_UPLOAD_MAX_PIXELS,
      })
        .resize(
          ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE,
          ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE,
          {
            fit: 'inside',
            withoutEnlargement: true,
          },
        )
        .webp({ quality: ADMIN_IMAGE_UPLOAD_THUMBNAIL_QUALITY })
        .bytes(),
    );

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
  });
