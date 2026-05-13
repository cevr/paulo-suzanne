import { defaultContent } from './defaults';
import type { SiteContent } from './schema';

import { MENU_PDF_PUBLIC_HREF } from '~/lib/managed-assets';

type MutableRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MutableRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordAt(parent: MutableRecord, key: string): MutableRecord {
  const current = parent[key];
  if (isRecord(current)) return current;
  const next: MutableRecord = {};
  parent[key] = next;
  return next;
}

function cloneRecord(value: unknown): MutableRecord {
  if (!isRecord(value)) return {};
  return structuredClone(value) as MutableRecord;
}

function derivedJsonLdImageKey(content: MutableRecord): string {
  const meta = content['meta'];
  if (!isRecord(meta)) return defaultContent.jsonLd.imageKey;
  const ogImage = meta['ogImage'];
  if (!isRecord(ogImage)) return defaultContent.jsonLd.imageKey;
  const key = ogImage['key'];
  return typeof key === 'string' && key.length > 0
    ? key
    : defaultContent.jsonLd.imageKey;
}

export function deriveLockedAssetFields(input: unknown): MutableRecord {
  const content = cloneRecord(input);
  const menu = recordAt(content, 'menu');
  const jsonLd = recordAt(content, 'jsonLd');

  menu['pdfHref'] = MENU_PDF_PUBLIC_HREF;
  jsonLd['imageKey'] = derivedJsonLdImageKey(content);
  jsonLd['menuPath'] = MENU_PDF_PUBLIC_HREF;

  return content;
}

export function deriveLockedSiteContentAssets(content: SiteContent): SiteContent {
  return {
    ...content,
    menu: {
      ...content.menu,
      pdfHref: MENU_PDF_PUBLIC_HREF,
    },
    jsonLd: {
      ...content.jsonLd,
      imageKey: content.meta.ogImage.key,
      menuPath: MENU_PDF_PUBLIC_HREF,
    },
  };
}
