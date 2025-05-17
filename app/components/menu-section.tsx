;
import { useLanguage } from "./language-provider";
import { NeoButton } from "~/components/ui/neo-button";
import { Download, FileText } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
} from "~/components/ui/carousel";

export function MenuSection() {
  const { t } = useLanguage();

  // Food image data with descriptions
  const foodImages = [
    {
      src: "/placeholder-xq2qh.png",
      alt: t("Classic Poutine", "Poutine Classique"),
      description: t(
        "Our famous classic poutine",
        "Notre fameuse poutine classique"
      ),
    },
    {
      src: "/deluxe-bacon-cheeseburger.png",
      alt: t("Paolo's Special Burger", "Burger Spécial de Paolo"),
      description: t(
        "Double beef patty with all the fixings",
        "Double galette de bœuf avec toutes les garnitures"
      ),
    },
    {
      src: "/club-sandwich-fries.png",
      alt: t("Club Sandwich", "Sandwich Club"),
      description: t(
        "Triple-decker with chicken and bacon",
        "Triple étage avec poulet et bacon"
      ),
    },
    {
      src: "/placeholder-0ruhj.png",
      alt: t("Smoked Meat Sandwich", "Sandwich au Smoked Meat"),
      description: t(
        "Montreal-style smoked meat",
        "Smoked meat style Montréal"
      ),
    },
  ];

  return (
    <section id="menu" className="py-20 bg-white scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="inline-block text-4xl md:text-5xl font-space-grotesk font-black mb-4 bg-secondary p-4 neo-brutalist rotate-[-1deg]">
            {t("OUR MENU", "NOTRE MENU")}
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            {t(
              "Serving Quebec's favorite comfort food since 1980",
              "Servant la cuisine réconfortante préférée du Québec depuis 1980"
            )}
          </p>

          {/* Food Image Carousel */}
          <div className="max-w-3xl mx-auto mb-12">
            <Carousel>
              <div className="neo-brutalist overflow-hidden">
                <CarouselContent>
                  {foodImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[16/10] w-full">
                        <img
                          src={image.src || "/placeholder.svg"}
                          alt={image.alt}
                          className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 w-full bg-black p-4 text-white">
                          <h3 className="text-xl font-space-grotesk font-bold">
                            {image.alt}
                          </h3>
                          <p>{image.description}</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </div>
              <CarouselPrevious className="neo-brutalist-sm" />
              <CarouselNext className="neo-brutalist-sm" />
              <CarouselDots />
            </Carousel>
          </div>

          <div className="max-w-md mx-auto bg-muted p-8 neo-brutalist">
            <div className="flex flex-col items-center">
              <FileText size={64} className="text-primary mb-4" />
              <h3 className="text-2xl font-space-grotesk font-bold mb-2">
                {t("Download Our Menu", "Téléchargez Notre Menu")}
              </h3>
              <p className="text-center mb-6">
                {t(
                  "View our complete menu with all our delicious poutines, burgers, and sandwiches.",
                  "Consultez notre menu complet avec toutes nos délicieuses poutines, burgers et sandwichs."
                )}
              </p>

              <div className="flex gap-4">
                <NeoButton
                  variant="default"
                  size="lg"
                  className="gap-2"
                  onClick={() => window.open("/menu.pdf", "_blank")}
                >
                  <FileText size={18} />
                  {t("View Menu", "Voir le Menu")}
                </NeoButton>

                <NeoButton
                  variant="secondary"
                  neoVariant="yellow"
                  size="lg"
                  className="gap-2"
                  onClick={() => window.open("/menu.pdf", "download")}
                >
                  <Download size={18} />
                  {t("Download PDF", "Télécharger PDF")}
                </NeoButton>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            {t(
              "* Menu prices and items subject to change without notice.",
              "* Les prix et les articles du menu peuvent changer sans préavis."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
