import {
  EDITOR_SECTION_KEYS,
  type EditorSectionKey,
} from '~/content/editor-sections';
import type { EditorAsset } from '~/content/editor-contract';
import type { SiteContent } from '~/content/schema';

import {
  AboutSection,
  ContactSection,
  FooterSection,
  HeaderSection,
  HeroSection,
  JsonLdSection,
  LocationSection,
  MenuPdfSection,
  MenuSection,
  MetaSection,
} from './sections';

type EditorSection = {
  readonly key: EditorSectionKey;
  readonly label: string;
  readonly description: string;
  readonly render: (
    content: SiteContent,
    assets: readonly EditorAsset[],
  ) => React.ReactNode;
};

type EditorSectionGroupKey = 'content' | 'search';

type EditorSectionPlacement = EditorSection & {
  readonly group: EditorSectionGroupKey;
  readonly navigationOrder: number;
};

type EditorSectionDefinition = Omit<EditorSectionPlacement, 'key'>;

const editorSectionDefinitions = {
  meta: {
    group: 'search',
    navigationOrder: 0,
    label: 'Search & sharing',
    description:
      'Page title, summary, and the image shown when the site is shared.',
    render: (content, assets) => (
      <MetaSection name="meta" defaultValue={content.meta} assets={assets} />
    ),
  },
  header: {
    group: 'content',
    navigationOrder: 1,
    label: 'Header & navigation',
    description: 'Logo, page links, ordering link, and menu labels.',
    render: (content, assets) => (
      <HeaderSection
        name="header"
        defaultValue={content.header}
        assets={assets}
      />
    ),
  },
  hero: {
    group: 'content',
    navigationOrder: 0,
    label: 'Main banner',
    description: 'The first message and actions visitors see.',
    render: (content, assets) => (
      <HeroSection name="hero" defaultValue={content.hero} assets={assets} />
    ),
  },
  about: {
    group: 'content',
    navigationOrder: 2,
    label: 'Our story',
    description: 'Restaurant story, highlights, and featured image.',
    render: (content, assets) => (
      <AboutSection name="about" defaultValue={content.about} assets={assets} />
    ),
  },
  menu: {
    group: 'content',
    navigationOrder: 3,
    label: 'Menu photos',
    description: 'Menu introduction and the photo carousel.',
    render: (content, assets) => (
      <MenuSection name="menu" defaultValue={content.menu} assets={assets} />
    ),
  },
  menuPdf: {
    group: 'content',
    navigationOrder: 4,
    label: 'Menu PDF',
    description: 'Download copy, menu document, and disclaimer.',
    render: (content, assets) => (
      <MenuPdfSection name="menu" defaultValue={content.menu} assets={assets} />
    ),
  },
  location: {
    group: 'content',
    navigationOrder: 5,
    label: 'Location & hours',
    description: 'Address, map, and opening hours.',
    render: (content, assets) => (
      <LocationSection
        name="location"
        defaultValue={content.location}
        assets={assets}
      />
    ),
  },
  contact: {
    group: 'content',
    navigationOrder: 6,
    label: 'Contact & social links',
    description: 'Phone, email, and social profiles.',
    render: (content, assets) => (
      <ContactSection
        name="contact"
        defaultValue={content.contact}
        assets={assets}
      />
    ),
  },
  footer: {
    group: 'content',
    navigationOrder: 7,
    label: 'Footer',
    description: 'Closing message, quick links, and contact details.',
    render: (content, assets) => (
      <FooterSection
        name="footer"
        defaultValue={content.footer}
        assets={assets}
      />
    ),
  },
  jsonLd: {
    group: 'search',
    navigationOrder: 1,
    label: 'Business details',
    description: 'Structured information used by search engines.',
    render: (content, assets) => (
      <JsonLdSection
        name="jsonLd"
        defaultValue={content.jsonLd}
        assets={assets}
      />
    ),
  },
} satisfies Record<EditorSectionKey, EditorSectionDefinition>;

const sectionPlacements: readonly EditorSectionPlacement[] =
  EDITOR_SECTION_KEYS.map((key) => ({
    key,
    ...editorSectionDefinitions[key],
  }));

const groupLabels = {
  content: 'Website content',
  search: 'Search settings',
} satisfies Record<EditorSectionGroupKey, string>;

export type EditorSectionGroup = {
  readonly key: EditorSectionGroupKey;
  readonly label: string;
  readonly sections: readonly EditorSection[];
};

export const editorSectionGroups: readonly EditorSectionGroup[] = (
  ['content', 'search'] as const
).map((group) => ({
  key: group,
  label: groupLabels[group],
  sections: sectionPlacements
    .filter((section) => section.group === group)
    .sort((a, b) => a.navigationOrder - b.navigationOrder)
    .map(
      ({ group: _group, navigationOrder: _navigationOrder, ...section }) =>
        section,
    ),
}));

export const editorSections: readonly EditorSection[] =
  editorSectionGroups.flatMap((group) => group.sections);
