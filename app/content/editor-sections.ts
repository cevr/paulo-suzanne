import type { SiteContent } from './schema';

export const EDITOR_SECTION_KEYS = [
  'meta',
  'header',
  'hero',
  'about',
  'menu',
  'menuPdf',
  'location',
  'contact',
  'footer',
  'jsonLd',
] as const;

export type EditorSectionKey = (typeof EDITOR_SECTION_KEYS)[number];

export function editorSectionForContentPath(
  head: keyof SiteContent,
  tailHead: PropertyKey | undefined,
): EditorSectionKey {
  if (
    head === 'menu' &&
    (tailHead === 'pdfHeading' ||
      tailHead === 'pdfBody' ||
      tailHead === 'pdfCta' ||
      tailHead === 'pdfHref' ||
      tailHead === 'disclaimer')
  ) {
    return 'menuPdf';
  }
  return head;
}
