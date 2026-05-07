import { AboutSection } from '~/components/about-section';
import { ContactSection } from '~/components/contact-section';
import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { Hero } from '~/components/hero';
import { LocationSection } from '~/components/location-section';
import { MenuSection } from '~/components/menu-section';
import type { SiteContent } from '~/content/schema';
import type { Lang } from '~/lib/language';

import type { Route } from './+types/home';

const CANONICAL_URL = 'https://pauloetsuzanne.com/';

export function meta({ matches }: Route.MetaArgs) {
  const { lang, content } = matches.find((match) => match?.id === 'root')
    ?.data as {
    lang: Lang;
    content: SiteContent;
  };

  const title = content.meta.title[lang];
  const description = content.meta.description[lang];
  const canonicalUrl = lang === 'fr' ? CANONICAL_URL : `${CANONICAL_URL}en`;
  const ogImageUrl = `${CANONICAL_URL}${content.meta.ogImage.key}`;

  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: canonicalUrl },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: ogImageUrl },
    { property: 'og:image:width', content: String(content.meta.ogImage.width) },
    {
      property: 'og:image:height',
      content: String(content.meta.ogImage.height),
    },
    { property: 'og:image:alt', content: content.meta.ogImage.alt[lang] },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: lang === 'fr' ? 'fr_CA' : 'en_CA' },
  ];
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <Hero />
      <MenuSection />
      <AboutSection />
      <LocationSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
