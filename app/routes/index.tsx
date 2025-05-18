import { Footer } from "~/components/footer";
import type { Route } from "./+types/index";
import { ContactSection } from "~/components/contact-section";
import { AboutSection } from "~/components/about-section";
import { Hero } from "~/components/hero";
import { Header } from "~/components/header";
import { LocationSection } from "~/components/location-section";
import { MenuSection } from "~/components/menu-section";
import type { Lang } from "~/lib/language";

export function meta({ matches }: Route.MetaArgs) {
  const { lang } = matches.find((match) => match?.id === "root")?.data as {
    lang: Lang;
  };

  const title =
    lang === "fr"
      ? "Paolo & Suzanne | L'Original Casse-Croûte"
      : "Paolo & Suzanne | The Original Casse-Croûte";
  const description =
    lang === "fr"
      ? "Poutine, burgers et sandwichs depuis 1980"
      : "Poutine, burgers and sandwiches since 1980";

  return [
    { title },
    {
      name: "description",
      content: description,
    },
  ];
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
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
