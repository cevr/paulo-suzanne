import { describe, expect, it } from 'effect-bun-test';
import { Effect } from 'effect';

import { Storage } from '~/services/Storage';

import {
  ADMIN_IMAGE_UPLOAD_CONTENT_TYPE,
  ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE,
  ingestAdminImage,
} from './admin-image-upload';

describe('admin image ingestion', () => {
  it.effect('validates, transforms, and stores the display image with its thumbnail', () =>
    Effect.gen(function* () {
      const source = Bun.file('public/images/logo-small.png');
      const buffer = yield* Effect.promise(() => source.arrayBuffer());
      const file = new File([buffer], 'Logo Small.PNG', { type: 'image/png' });

      const ingested = yield* ingestAdminImage(file, 1778688000000);
      const storage = yield* Storage;
      const image = yield* storage.get(ingested.key);
      const thumbnail = yield* storage.get(ingested.thumbnailKey);
      const thumbnailBytes = yield* Effect.promise(() =>
        new Response(thumbnail.stream).arrayBuffer(),
      );
      const thumbnailMetadata = yield* Effect.promise(() =>
        new Bun.Image(thumbnailBytes).metadata(),
      );

      expect(ingested.key).toBe('images/uploads/logo-small-20260513T160000.webp');
      expect(ingested.thumbnailKey).toBe(
        'images/uploads/logo-small-20260513T160000.thumb.webp',
      );
      expect(image.contentType).toBe(ADMIN_IMAGE_UPLOAD_CONTENT_TYPE);
      expect(image.size).toBeGreaterThan(0);
      expect(thumbnail.contentType).toBe(ADMIN_IMAGE_UPLOAD_CONTENT_TYPE);
      expect(thumbnailMetadata.format).toBe('webp');
      expect(thumbnailMetadata.width).toBeLessThanOrEqual(
        ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE,
      );
      expect(thumbnailMetadata.height).toBeLessThanOrEqual(
        ADMIN_IMAGE_UPLOAD_THUMBNAIL_EDGE,
      );
    }).pipe(Effect.provide(Storage.layerTest())),
  );

  it.effect('rejects unsupported files before writing any assets', () =>
    Effect.gen(function* () {
      const file = new File(['not an image'], 'menu.pdf', {
        type: 'application/pdf',
      });

      const error = yield* Effect.flip(ingestAdminImage(file, 1778688000000));
      const storage = yield* Storage;

      expect(error.message).toContain('JPEG, PNG, WebP, GIF, or AVIF');
      expect(yield* storage.list()).toEqual([]);
    }).pipe(Effect.provide(Storage.layerTest())),
  );
});
