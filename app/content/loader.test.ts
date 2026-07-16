import { describe, expect, it } from 'effect-bun-test';
import { ConfigProvider, DateTime, Effect, Layer } from 'effect';

import { defaultContent } from './defaults';
import { Content, loadAdminContent, loadContent } from './loader';
import type { SiteContent } from './schema';
import { Storage } from '~/services/Storage';

const emptyConfig = ConfigProvider.fromUnknown({});
const allowDefaultsConfig = ConfigProvider.fromUnknown({
  ALLOW_DEFAULT_CONTENT: '1',
});
const disallowDefaultsConfig = ConfigProvider.fromUnknown({
  ALLOW_DEFAULT_CONTENT: '0',
});

const date = (iso: string): Date => DateTime.toDateUtc(DateTime.makeUnsafe(iso));

function expectFailureCause(exit: { readonly _tag: string; readonly cause?: unknown }): string {
  expect(exit._tag).toBe('Failure');
  return String(exit.cause);
}

describe('loadContent', () => {
  it.effect('returns bundled defaults when bucket env is unset and ALLOW_DEFAULT_CONTENT=1', () =>
    Effect.gen(function* () {
      const content = yield* loadContent;
      expect(content).toEqual(defaultContent);
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Content.layer,
          Storage.layerTest(),
          ConfigProvider.layer(allowDefaultsConfig),
        ),
      ),
    ),
  );

  it.effect('throws when bucket env is unset and ALLOW_DEFAULT_CONTENT is unset', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(loadContent);
      const cause = expectFailureCause(exit);
      expect(cause).toContain('no content/site.json');
      expect(cause).toContain('refusing to ship defaults');
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Content.layer,
          Storage.layerTest(),
          ConfigProvider.layer(emptyConfig),
        ),
      ),
    ),
  );

  it.effect('throws when ALLOW_DEFAULT_CONTENT is "0" (anything other than "1")', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(loadContent);
      expectFailureCause(exit);
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Content.layer,
          Storage.layerTest(),
          ConfigProvider.layer(disallowDefaultsConfig),
        ),
      ),
    ),
  );
});

function contentWithHeroTagline(tagline: string): SiteContent {
  return {
    ...defaultContent,
    hero: {
      ...defaultContent.hero,
      tagline: {
        en: tagline,
        fr: defaultContent.hero.tagline.fr,
      },
    },
  };
}

describe('loadAdminContentFromStorage', () => {
  it.effect('prefers draft content when a draft exists', () => {
    const published = defaultContent;
    const draft = contentWithHeroTagline('Draft tagline');
    const draftModified = date('2026-05-06T12:00:00.000Z');

    return Effect.gen(function* () {
      const result = yield* loadAdminContent;

      expect(result.source).toBe('draft');
      expect(result.content.hero.tagline.en).toBe('Draft tagline');
      expect(result.draftLastModified).toBe(draftModified.getTime());
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Content.layer,
          Storage.layerTest({
            'content/site.json': {
              body: JSON.stringify(published),
              lastModified: date('2026-05-05T12:00:00.000Z'),
            },
            'content/site.draft.json': {
              body: JSON.stringify(draft),
              lastModified: draftModified,
            },
          }),
        ),
      ),
    );
  });

  it.effect('falls back to published content when no draft exists', () => {
    const published = contentWithHeroTagline('Published tagline');

    return Effect.gen(function* () {
      const result = yield* loadAdminContent;

      expect(result.source).toBe('published');
      expect(result.content.hero.tagline.en).toBe('Published tagline');
      expect(result.draftLastModified).toBe(null);
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Content.layer,
          Storage.layerTest({
            'content/site.json': {
              body: JSON.stringify(published),
              lastModified: date('2026-05-05T12:00:00.000Z'),
            },
          }),
        ),
      ),
    );
  });

  it.effect('throws when draft content fails schema decoding', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(loadAdminContent);
      const cause = expectFailureCause(exit);
      expect(cause).toContain('failed to decode content/site.draft.json');
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Content.layer,
          Storage.layerTest({
            'content/site.json': {
              body: JSON.stringify(defaultContent),
              lastModified: date('2026-05-05T12:00:00.000Z'),
            },
            'content/site.draft.json': {
              body: JSON.stringify({
                ...defaultContent,
                hero: { ...defaultContent.hero, tagline: { en: '', fr: '' } },
              }),
              lastModified: date('2026-05-06T12:00:00.000Z'),
            },
          }),
        ),
      ),
    ),
  );
});
