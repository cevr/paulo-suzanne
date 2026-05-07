import { describe, expect, it } from 'bun:test';
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
  it('accepts plain relative paths', async () => {
    expect(await Effect.runPromise(decodeAssetKey('indoor.avif'))).toBe(
      'indoor.avif',
    );
    expect(await Effect.runPromise(decodeAssetKey('images/food/x.avif'))).toBe(
      'images/food/x.avif',
    );
  });

  it('rejects leading slash', async () => {
    const exit = await Effect.runPromiseExit(decodeAssetKey('/indoor.avif'));
    expect(exit._tag).toBe('Failure');
  });

  it('rejects URL schemes', async () => {
    for (const v of [
      'http://example.com/x.png',
      'https://x.png',
      'data:image/png;base64,xx',
      'javascript:alert(1)',
    ]) {
      const exit = await Effect.runPromiseExit(decodeAssetKey(v));
      expect(exit._tag).toBe('Failure');
    }
  });

  it('rejects traversal segments', async () => {
    for (const v of ['../foo.png', 'a/../b.png', './foo.png', 'a//b.png']) {
      const exit = await Effect.runPromiseExit(decodeAssetKey(v));
      expect(exit._tag).toBe('Failure');
    }
  });

  it('rejects empty string', async () => {
    const exit = await Effect.runPromiseExit(decodeAssetKey(''));
    expect(exit._tag).toBe('Failure');
  });
});

describe('ImageRef', () => {
  it('accepts a fully-formed ref', async () => {
    const r = await Effect.runPromise(decodeImageRef(validImage));
    expect(r.key).toBe('images/logo.png');
  });

  it('rejects non-positive dimensions', async () => {
    const exit = await Effect.runPromiseExit(
      decodeImageRef({ ...validImage, width: 0 }),
    );
    expect(exit._tag).toBe('Failure');
  });

  it('rejects missing alt translations', async () => {
    const exit = await Effect.runPromiseExit(
      decodeImageRef({ ...validImage, alt: { en: 'Logo' } }),
    );
    expect(exit._tag).toBe('Failure');
  });
});

describe('SocialKind', () => {
  it('accepts known kinds', async () => {
    expect(await Effect.runPromise(decodeSocialKind('instagram'))).toBe(
      'instagram',
    );
    expect(await Effect.runPromise(decodeSocialKind('facebook'))).toBe(
      'facebook',
    );
  });

  it('rejects unknown kinds', async () => {
    const exit = await Effect.runPromiseExit(decodeSocialKind('twitter'));
    expect(exit._tag).toBe('Failure');
  });
});

describe('SiteContent', () => {
  it('round-trips bundled defaults through encode/decode', async () => {
    const encoded = JSON.parse(JSON.stringify(defaultContent));
    const decoded = await Effect.runPromise(decodeSiteContent(encoded));
    expect(decoded.contact.socials.length).toBe(2);
    expect(decoded.contact.socials[0]?.kind).toBe('instagram');
  });

  it('rejects empty navLinks', async () => {
    const broken = JSON.parse(JSON.stringify(defaultContent));
    broken.header.navLinks = [];
    const exit = await Effect.runPromiseExit(decodeSiteContent(broken));
    expect(exit._tag).toBe('Failure');
  });

  it('rejects empty carousel', async () => {
    const broken = JSON.parse(JSON.stringify(defaultContent));
    broken.menu.carousel = [];
    const exit = await Effect.runPromiseExit(decodeSiteContent(broken));
    expect(exit._tag).toBe('Failure');
  });

  it('rejects empty hours', async () => {
    const broken = JSON.parse(JSON.stringify(defaultContent));
    broken.location.hours = [];
    const exit = await Effect.runPromiseExit(decodeSiteContent(broken));
    expect(exit._tag).toBe('Failure');
  });

  it('rejects empty socials', async () => {
    const broken = JSON.parse(JSON.stringify(defaultContent));
    broken.contact.socials = [];
    const exit = await Effect.runPromiseExit(decodeSiteContent(broken));
    expect(exit._tag).toBe('Failure');
  });

  it('rejects ImageRef with leading slash anywhere in the tree', async () => {
    const broken = JSON.parse(JSON.stringify(defaultContent));
    broken.meta.ogImage.key = '/indoor.avif';
    const exit = await Effect.runPromiseExit(decodeSiteContent(broken));
    expect(exit._tag).toBe('Failure');
  });

  it('rejects jsonLd.imageKey with URL scheme', async () => {
    const broken = JSON.parse(JSON.stringify(defaultContent));
    broken.jsonLd.imageKey = 'https://example.com/x.png';
    const exit = await Effect.runPromiseExit(decodeSiteContent(broken));
    expect(exit._tag).toBe('Failure');
  });
});
