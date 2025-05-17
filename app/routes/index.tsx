import { Footer } from "~/components/footer";
import type { Route } from "./+types/index";
import { ContactSection } from "~/components/contact-section";
import { AboutSection } from "~/components/about-section";
import { Hero } from "~/components/hero";
import { Header } from "~/components/header";
import { LocationSection } from "~/components/location-section";
import { MenuSection } from "~/components/menu-section";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Paolo & Suzanne | L'Original Casse-Croûte" },
    {
      name: "description",
      content:
        "Poutine, burgers et sandwichs depuis 1980 | Poutine, burgers and sandwiches since 1980",
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
