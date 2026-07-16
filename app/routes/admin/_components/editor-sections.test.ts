import { describe, expect, test } from 'bun:test';

import { EDITOR_SECTION_KEYS } from '~/content/editor-sections';

import { editorSectionGroups, editorSections } from './editor-sections';

describe('editor section registry', () => {
  test('owns the grouped desktop and mobile navigation order', () => {
    expect(
      editorSectionGroups.map((group) => ({
        label: group.label,
        sections: group.sections.map((section) => section.key),
      })),
    ).toEqual([
      {
        label: 'Website content',
        sections: [
          'hero',
          'header',
          'about',
          'menu',
          'menuPdf',
          'location',
          'contact',
          'footer',
        ],
      },
      {
        label: 'Search settings',
        sections: ['meta', 'jsonLd'],
      },
    ]);
  });

  test('places every canonical editorial section exactly once', () => {
    const keys = editorSections.map((section) => section.key);

    expect(keys).toHaveLength(EDITOR_SECTION_KEYS.length);
    expect([...keys].sort()).toEqual([...EDITOR_SECTION_KEYS].sort());
  });
});
