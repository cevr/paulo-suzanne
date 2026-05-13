import { describe, expect, it } from 'effect-bun-test';
import { Effect, Schema } from 'effect';

import { AssetKey } from '~/content/schema';

import {
  ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE,
  processAdminImageUpload,
  uploadKeyForImage,
} from './admin-image-upload';
import {
  ADMIN_IMAGE_UPLOAD_CONTENT_TYPE,
  isAcceptedAdminImageType,
  thumbnailKeyForImage,
} from './uploaded-image-assets';

const decodeAssetKey = Schema.decodeUnknownEffect(AssetKey);

describe('admin image uploads', () => {
  it.effect('creates stable webp upload keys from original file names', () =>
    Effect.sync(() => {
      expect(uploadKeyForImage('Crêpes & Coffee.JPG', 1778688000000)).toBe(
        'images/uploads/crepes-coffee-20260513T160000.webp',
      );
    }),
  );

  it.effect('accepts images that Bun.Image can process for the admin upload form', () =>
    Effect.sync(() => {
      expect(isAcceptedAdminImageType('image/jpeg')).toBe(true);
      expect(isAcceptedAdminImageType('image/png')).toBe(true);
      expect(isAcceptedAdminImageType('application/pdf')).toBe(false);
    }),
  );

  it.effect('derives thumbnail keys beside the processed upload', () =>
    Effect.sync(() => {
      expect(
        thumbnailKeyForImage('images/uploads/crepes-coffee-20260513T160000.webp'),
      ).toBe('images/uploads/crepes-coffee-20260513T160000.thumb.webp');
      expect(
        thumbnailKeyForImage('images/uploads/crepes-coffee-20260513T160000.avif'),
      ).toBe('images/uploads/crepes-coffee-20260513T160000.thumb.avif');
    }),
  );

  it.effect('keeps processed extension changes valid for content asset keys', () =>
    Effect.gen(function* () {
      const key = uploadKeyForImage('Crêpes & Coffee.JPG', 1778688000000);
      const thumbnailKey = thumbnailKeyForImage(key);

      expect(yield* decodeAssetKey(key)).toBe(key);
      expect(yield* decodeAssetKey(thumbnailKey)).toBe(thumbnailKey);
      expect(key).not.toContain('.jpg');
      expect(key).not.toContain('.jpeg');
    }),
  );

  it.effect('processes an uploaded image and emits a thumbnail companion', () =>
    Effect.gen(function* () {
      const source = Bun.file('public/images/logo-small.png');
      const buffer = yield* Effect.promise(() => source.arrayBuffer());
      const file = new File([buffer], 'Logo Small.PNG', {
        type: 'image/png',
      });

      const processed = yield* processAdminImageUpload(file, 1778688000000);
      const thumbnail = yield* Effect.promise(() =>
        new Bun.Image(processed.thumbnailBytes).metadata(),
      );

      expect(processed.key).toBe('images/uploads/logo-small-20260513T160000.webp');
      expect(processed.thumbnailKey).toBe(
        'images/uploads/logo-small-20260513T160000.thumb.webp',
      );
      expect(processed.bytes.byteLength).toBeGreaterThan(0);
      expect(processed.thumbnailBytes.byteLength).toBeGreaterThan(0);
      expect(ADMIN_IMAGE_UPLOAD_CONTENT_TYPE).toBe('image/webp');
      expect(thumbnail.format).toBe('webp');
      expect(thumbnail.width).toBeLessThanOrEqual(ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE);
      expect(thumbnail.height).toBeLessThanOrEqual(ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE);
    }),
  );
});
