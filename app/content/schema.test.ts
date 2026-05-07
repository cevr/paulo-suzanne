import { describe, expect, it } from 'effect-bun-test';
import { Effect, Schema } from 'effect';

import { defaultContent } from './defaults';
import { AssetKey, ImageRef, SiteContent, SocialKind } from './schema';

const decodeAssetKey = Schema.decodeUnknownEffect(AssetKey);
const decodeImageRef = Schema.decodeUnknownEffect(ImageRef);
const decodeSiteContent = Schema.decodeUnknownEffect(SiteContent);
const decodeSocialKind = Schema.decodeUnknownEffect(SocialKind);

const validImage = {
  key: 'images/logo.png',
  alt: { en: 'Logo', fr: 'Logo' },
  width: 100,
  height: 100,
};

describe('AssetKey', () => {
  it.effect('accepts plain relative paths', () =>
    Effect.gen(function* () {
      expect(yield* decodeAssetKey('indoor.avif')).toBe('indoor.avif');
      expect(yield* decodeAssetKey('images/food/x.avif')).toBe(
        'images/food/x.avif',
      );
    }),
  );

  it.effect('rejects leading slash', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(decodeAssetKey('/indoor.avif'));
      expect(exit._tag).toBe('Failure');
    }),
  );

  it.effect('rejects URL schemes', () =>
    Effect.gen(function* () {
      for (const v of [
        'http://example.com/x.png',
        'https://x.png',
        'data:image/png;base64,xx',
        'javascript:alert(1)',
      ]) {
        const exit = yield* Effect.exit(decodeAssetKey(v));
        expect(exit._tag).toBe('Failure');
      }
    }),
  );

  it.effect('rejects traversal segments', () =>
    Effect.gen(function* () {
      for (const v of ['../foo.png', 'a/../b.png', './foo.png', 'a//b.png']) {
        const exit = yield* Effect.exit(decodeAssetKey(v));
        expect(exit._tag).toBe('Failure');
      }
    }),
  );

  it.effect('rejects empty string', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(decodeAssetKey(''));
      expect(exit._tag).toBe('Failure');
    }),
  );
});

describe('ImageRef', () => {
  it.effect('accepts a fully-formed ref', () =>
    Effect.gen(function* () {
      const r = yield* decodeImageRef(validImage);
      expect(r.key).toBe('images/logo.png');
    }),
  );

  it.effect('rejects non-positive dimensions', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(decodeImageRef({ ...validImage, width: 0 }));
      expect(exit._tag).toBe('Failure');
    }),
  );

  it.effect('rejects missing alt translations', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        decodeImageRef({ ...validImage, alt: { en: 'Logo' } }),
      );
      expect(exit._tag).toBe('Failure');
    }),
  );
});

describe('SocialKind', () => {
  it.effect('accepts known kinds', () =>
    Effect.gen(function* () {
      expect(yield* decodeSocialKind('instagram')).toBe('instagram');
      expect(yield* decodeSocialKind('facebook')).toBe('facebook');
    }),
  );

  it.effect('rejects unknown kinds', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(decodeSocialKind('twitter'));
      expect(exit._tag).toBe('Failure');
    }),
  );
});

describe('SiteContent', () => {
  it.effect('round-trips bundled defaults through encode/decode', () =>
    Effect.gen(function* () {
      const decoded = yield* decodeSiteContent(defaultContent);
      expect(decoded.contact.socials.length).toBe(2);
      expect(decoded.contact.socials[0]?.kind).toBe('instagram');
    }),
  );

  it.effect('rejects empty navLinks', () =>
    Effect.gen(function* () {
      const broken = {
        ...defaultContent,
        header: { ...defaultContent.header, navLinks: [] },
      };
      const exit = yield* Effect.exit(decodeSiteContent(broken));
      expect(exit._tag).toBe('Failure');
    }),
  );

  it.effect('rejects empty carousel', () =>
    Effect.gen(function* () {
      const broken = {
        ...defaultContent,
        menu: { ...defaultContent.menu, carousel: [] },
      };
      const exit = yield* Effect.exit(decodeSiteContent(broken));
      expect(exit._tag).toBe('Failure');
    }),
  );

  it.effect('rejects empty hours', () =>
    Effect.gen(function* () {
      const broken = {
        ...defaultContent,
        location: { ...defaultContent.location, hours: [] },
      };
      const exit = yield* Effect.exit(decodeSiteContent(broken));
      expect(exit._tag).toBe('Failure');
    }),
  );

  it.effect('rejects empty socials', () =>
    Effect.gen(function* () {
      const broken = {
        ...defaultContent,
        contact: { ...defaultContent.contact, socials: [] },
      };
      const exit = yield* Effect.exit(decodeSiteContent(broken));
      expect(exit._tag).toBe('Failure');
    }),
  );

  it.effect('rejects ImageRef with leading slash anywhere in the tree', () =>
    Effect.gen(function* () {
      const broken = {
        ...defaultContent,
        meta: {
          ...defaultContent.meta,
          ogImage: { ...defaultContent.meta.ogImage, key: '/indoor.avif' },
        },
      };
      const exit = yield* Effect.exit(decodeSiteContent(broken));
      expect(exit._tag).toBe('Failure');
    }),
  );

  it.effect('rejects jsonLd.imageKey with URL scheme', () =>
    Effect.gen(function* () {
      const broken = {
        ...defaultContent,
        jsonLd: {
          ...defaultContent.jsonLd,
          imageKey: 'https://example.com/x.png',
        },
      };
      const exit = yield* Effect.exit(decodeSiteContent(broken));
      expect(exit._tag).toBe('Failure');
    }),
  );
});
