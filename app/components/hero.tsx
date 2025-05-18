import { Link } from "react-router";
import { useLanguage } from "../lib/language-provider";
import { NeoButton } from "~/components/ui/neo-button";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-secondary py-20 md:py-32">
      <div className="retro-pattern absolute inset-0"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-white p-4 mb-6 -rotate-2 neo-brutalist">
            <h1 className="text-4xl md:text-6xl font-space-grotesk font-black text-primary">
              {t("SINCE 1980", "DEPUIS 1980")}
            </h1>
          </div>

          <h2 className="text-5xl md:text-7xl font-space-grotesk font-black mb-6 text-black">
            {t("LEGENDARY POUTINE & BURGERS", "POUTINE & BURGERS LÉGENDAIRES")}
          </h2>

          <p className="text-xl md:text-2xl font-bold mb-8 bg-white p-4 inline-block neo-brutalist rotate-1">
            {t(
              "Open 24/7 - The Original Casse-Croûte",
              "Ouvert 24/7 - L'Original Casse-Croûte"
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NeoButton variant="default" size="lg" className="text-lg">
              <Link to="#menu">{t("View Menu", "Voir le Menu")}</Link>
            </NeoButton>
            <NeoButton
              variant="secondary"
              neoVariant="yellow"
              size="lg"
              className="text-lg"
            >
              {t("Order Online", "Commander en ligne")}
            </NeoButton>
          </div>
        </div>
      </div>
    </section>
  );
}
