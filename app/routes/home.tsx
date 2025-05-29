import { AboutSection } from '~/components/about-section';
import { ContactSection } from '~/components/contact-section';
import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { Hero } from '~/components/hero';
import { LocationSection } from '~/components/location-section';
import { MenuSection } from '~/components/menu-section';
import type { Lang } from '~/lib/language';

import type { Route } from './+types/home';

export function meta({ matches }: Route.MetaArgs) {
  const { lang } = matches.find((match) => match?.id === 'root')?.data as {
    lang: Lang;
  };

  const title =
    lang === 'fr'
      ? "Paulo & Suzanne | L'Original Casse-Croûte"
      : 'Paulo & Suzanne | The Original Casse-Croûte';
  const description =
    lang === 'fr'
      ? 'Poutine, burgers et sandwichs depuis 1980'
      : 'Poutine, burgers and sandwiches since 1980';

  return [
    { title },
    {
      name: 'description',
      content: description,
    },
    {
      property: 'og:image',
      content: '/indoor.avif',
    },
    {
      property: 'og:image:width',
      content: '800',
    },
    {
      property: 'og:image:height',
      content: '600',
    },
    {
      property: 'og:type',
      content: 'website',
    },
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
