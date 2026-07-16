import {
  EDITOR_SECTION_KEYS,
  type EditorSectionKey,
} from '~/content/editor-sections';
import type { EditorAsset } from '~/content/editor';
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
  readonly defaultOpen: boolean;
  readonly render: (
    content: SiteContent,
    assets: readonly EditorAsset[],
  ) => React.ReactNode;
};

type EditorSectionDefinition = Omit<EditorSection, 'key'>;

const editorSectionDefinitions = {
  meta: {
    label: 'Search & sharing',
    description:
      'Page title, summary, and the image shown when the site is shared.',
    defaultOpen: true,
    render: (content, assets) => (
      <MetaSection name="meta" defaultValue={content.meta} assets={assets} />
    ),
  },
  header: {
    label: 'Header & navigation',
    description: 'Logo, page links, ordering link, and menu labels.',
    defaultOpen: true,
    render: (content, assets) => (
      <HeaderSection
        name="header"
        defaultValue={content.header}
        assets={assets}
      />
    ),
  },
  hero: {
    label: 'Main banner',
    description: 'The first message and actions visitors see.',
    defaultOpen: true,
    render: (content, assets) => (
      <HeroSection name="hero" defaultValue={content.hero} assets={assets} />
    ),
  },
  about: {
    label: 'Our story',
    description: 'Restaurant story, highlights, and featured image.',
    defaultOpen: false,
    render: (content, assets) => (
      <AboutSection name="about" defaultValue={content.about} assets={assets} />
    ),
  },
  menu: {
    label: 'Menu photos',
    description: 'Menu introduction and the photo carousel.',
    defaultOpen: false,
    render: (content, assets) => (
      <MenuSection name="menu" defaultValue={content.menu} assets={assets} />
    ),
  },
  menuPdf: {
    label: 'Menu PDF',
    description: 'Download copy, menu document, and disclaimer.',
    defaultOpen: false,
    render: (content, assets) => (
      <MenuPdfSection name="menu" defaultValue={content.menu} assets={assets} />
    ),
  },
  location: {
    label: 'Location & hours',
    description: 'Address, map, and opening hours.',
    defaultOpen: false,
    render: (content, assets) => (
      <LocationSection
        name="location"
        defaultValue={content.location}
        assets={assets}
      />
    ),
  },
  contact: {
    label: 'Contact & social links',
    description: 'Phone, email, and social profiles.',
    defaultOpen: false,
    render: (content, assets) => (
      <ContactSection
        name="contact"
        defaultValue={content.contact}
        assets={assets}
      />
    ),
  },
  footer: {
    label: 'Footer',
    description: 'Closing message, quick links, and contact details.',
    defaultOpen: false,
    render: (content, assets) => (
      <FooterSection
        name="footer"
        defaultValue={content.footer}
        assets={assets}
      />
    ),
  },
  jsonLd: {
    label: 'Business details',
    description: 'Structured information used by search engines.',
    defaultOpen: false,
    render: (content, assets) => (
      <JsonLdSection
        name="jsonLd"
        defaultValue={content.jsonLd}
        assets={assets}
      />
    ),
  },
} satisfies Record<EditorSectionKey, EditorSectionDefinition>;

export const editorSections: readonly EditorSection[] = EDITOR_SECTION_KEYS.map(
  (key) => ({ key, ...editorSectionDefinitions[key] }),
);
