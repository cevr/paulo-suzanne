import { describe, expect, it } from 'effect-bun-test';
import { Effect } from 'effect';

import { defaultContent } from './defaults';
import { hashContent } from './publish-state';
import type { SiteContent } from './schema';

describe('hashContent', () => {
  it.effect('is stable across runs', () => Effect.sync(() => {
    expect(hashContent(defaultContent)).toBe(hashContent(defaultContent));
  }));

  it.effect('is invariant to top-level key order', () => Effect.sync(() => {
    const reordered = {
      jsonLd: defaultContent.jsonLd,
      footer: defaultContent.footer,
      contact: defaultContent.contact,
      location: defaultContent.location,
      menu: defaultContent.menu,
      about: defaultContent.about,
      hero: defaultContent.hero,
      header: defaultContent.header,
      meta: defaultContent.meta,
    } as SiteContent;
    expect(hashContent(reordered)).toBe(hashContent(defaultContent));
  }));

  it.effect('is invariant to nested key order', () => Effect.sync(() => {
    const tweaked: SiteContent = {
      ...defaultContent,
      meta: {
        // swap order of fields inside meta
        ogImage: defaultContent.meta.ogImage,
        description: defaultContent.meta.description,
        title: defaultContent.meta.title,
      },
    };
    expect(hashContent(tweaked)).toBe(hashContent(defaultContent));
  }));

  it.effect('changes when a leaf string changes', () => Effect.sync(() => {
    const tweaked: SiteContent = {
      ...defaultContent,
      meta: {
        ...defaultContent.meta,
        title: { en: 'Different', fr: 'Different' },
      },
    };
    expect(hashContent(tweaked)).not.toBe(hashContent(defaultContent));
  }));

  it.effect('changes when array order changes', () => Effect.sync(() => {
    const reordered: SiteContent = {
      ...defaultContent,
      contact: {
        ...defaultContent.contact,
        socials: [
          defaultContent.contact.socials[1]!,
          defaultContent.contact.socials[0]!,
        ] as typeof defaultContent.contact.socials,
      },
    };
    expect(hashContent(reordered)).not.toBe(hashContent(defaultContent));
  }));

  it.effect('returns a hex string of stable length', () => Effect.sync(() => {
    const h = hashContent(defaultContent);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  }));
});
