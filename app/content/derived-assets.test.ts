import { describe, expect, it } from 'effect-bun-test';
import { Effect, Schema } from 'effect';

import { MENU_PDF_PUBLIC_HREF } from '~/lib/managed-assets';

import { defaultContent } from './defaults';
import {
  deriveLockedAssetFields,
  deriveLockedSiteContentAssets,
} from './derived-assets';
import { SiteContent } from './schema';

const decodeSiteContent = Schema.decodeUnknownEffect(SiteContent);

describe('deriveLockedAssetFields', () => {
  it.effect('locks menu PDF paths and derives JSON-LD image from the uploaded asset ref', () =>
    Effect.gen(function* () {
      const derived = deriveLockedAssetFields({
        ...defaultContent,
        meta: {
          ...defaultContent.meta,
          ogImage: {
            ...defaultContent.meta.ogImage,
            key: 'images/uploads/new-cover-20260513T160000.webp',
          },
        },
        menu: {
          ...defaultContent.menu,
          pdfHref: 'https://example.com/editable.pdf',
        },
        jsonLd: {
          ...defaultContent.jsonLd,
          imageKey: 'https://example.com/editable.png',
          menuPath: 'https://example.com/menu.pdf',
        },
      });

      const content = yield* decodeSiteContent(derived);

      expect(content.menu.pdfHref).toBe(MENU_PDF_PUBLIC_HREF);
      expect(content.jsonLd.menuPath).toBe(MENU_PDF_PUBLIC_HREF);
      expect(content.jsonLd.imageKey).toBe(
        'images/uploads/new-cover-20260513T160000.webp',
      );
    }),
  );

  it.effect('derives locked asset fields for already decoded content', () =>
    Effect.gen(function* () {
      const content = yield* decodeSiteContent({
        ...defaultContent,
        meta: {
          ...defaultContent.meta,
          ogImage: {
            ...defaultContent.meta.ogImage,
            key: 'images/uploads/current-og-20260513T160000.webp',
          },
        },
        menu: { ...defaultContent.menu, pdfHref: '/old-menu.pdf' },
        jsonLd: {
          ...defaultContent.jsonLd,
          imageKey: 'indoor.avif',
          menuPath: '/old-menu.pdf',
        },
      });

      const derived = deriveLockedSiteContentAssets(content);

      expect(derived.menu.pdfHref).toBe(MENU_PDF_PUBLIC_HREF);
      expect(derived.jsonLd.menuPath).toBe(MENU_PDF_PUBLIC_HREF);
      expect(derived.jsonLd.imageKey).toBe(
        'images/uploads/current-og-20260513T160000.webp',
      );
    }),
  );
});
