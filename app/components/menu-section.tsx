import { Download, FileText } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import { NeoButton } from '~/components/ui/neo-button';

import { useLanguage } from '../lib/language-provider';

export function MenuSection() {
  const { t } = useLanguage();

  // Food image data with descriptions
  const foodImages = [
    {
      src: '/placeholder-xq2qh.png',
      alt: t('Classic Poutine', 'Poutine Classique'),
      description: t(
        'Our famous classic poutine',
        'Notre fameuse poutine classique',
      ),
    },
    {
      src: '/deluxe-bacon-cheeseburger.png',
      alt: t("Paulo's Special Burger", 'Burger Spécial de Paulo'),
      description: t(
        'Double beef patty with all the fixings',
        'Double galette de bœuf avec toutes les garnitures',
      ),
    },
    {
      src: '/club-sandwich-fries.png',
      alt: t('Club Sandwich', 'Sandwich Club'),
      description: t(
        'Triple-decker with chicken and bacon',
        'Triple étage avec poulet et bacon',
      ),
    },
    {
      src: '/placeholder-0ruhj.png',
      alt: t('Smoked Meat Sandwich', 'Sandwich au Smoked Meat'),
      description: t(
        'Montreal-style smoked meat',
        'Smoked meat style Montréal',
      ),
    },
  ];

  return (
    <section
      id="menu"
      className="scroll-mt-24 bg-white py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-space-grotesk bg-secondary neo-brutalist mb-4 inline-block -rotate-1 p-4 text-4xl font-black md:text-5xl">
            {t('OUR MENU', 'NOTRE MENU')}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl">
            {t(
              "Serving Quebec's favorite comfort food since 1980",
              'Servant la cuisine réconfortante préférée du Québec depuis 1980',
            )}
          </p>

          {/* Food Image Carousel */}
          <div className="mx-auto mb-12 max-w-3xl">
            <Carousel>
              <div className="neo-brutalist overflow-hidden">
                <CarouselContent>
                  {foodImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-16/10 w-full">
                        <img
                          src={image.src || '/placeholder.svg'}
                          alt={image.alt}
                          className="object-cover"
                        />
                        <div className="absolute right-0 bottom-0 left-0 w-full bg-black p-4 text-white">
                          <h3 className="font-space-grotesk text-xl font-bold">
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

          <div className="bg-muted neo-brutalist mx-auto max-w-md p-8">
            <div className="flex flex-col items-center">
              <FileText
                size={64}
                className="text-primary mb-4"
              />
              <h3 className="font-space-grotesk mb-2 text-2xl font-bold">
                {t('View Our Menu', 'Voir Notre Menu')}
              </h3>
              <p className="mb-6 text-center">
                {t(
                  'View our complete menu with all our delicious poutines, burgers, and sandwiches.',
                  'Consultez notre menu complet avec toutes nos délicieuses poutines, burgers et sandwichs.',
                )}
              </p>

              <div className="flex gap-4">
                <a
                  href="https://nebula.wsimg.com/d6f136992ba0c8cc1b43f24bb13938e2?AccessKeyId=4A810DB41D146C1A6336&disposition=0&alloworigin=1"
                  target="_blank"
                >
                  <NeoButton
                    variant="default"
                    size="lg"
                    className="gap-2"
                  >
                    <FileText size={18} />
                    {t('View Menu', 'Voir le Menu')}
                  </NeoButton>
                </a>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            {t(
              '* Menu prices and items subject to change without notice.',
              '* Les prix et les articles du menu peuvent changer sans préavis.',
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
