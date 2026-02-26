import { FileText } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import { cn } from '~/lib/utils';

import { useTranslate } from '../lib/language-provider';

export function MenuSection() {
  const t = useTranslate();

  // Food image data with descriptions
  const foodImages = [
    {
      src: '/images/food/poutine-pop-n-hot.avif',
      alt: t("Poutine Pop'n'Hot", "Poutine Pop'n'Hot"),
      description: t(
        "Our Pop'n'Hot Poutine with popcorn chicken, bacon, hot peppers and southwest sauce",
        "Notre Poutine Pop'n'Hot avec poulet popcorn, bacon, piments forts et sauce sud-ouest",
      ),
    },
    {
      src: '/images/food/poutine-extra-cheese.avif',
      alt: t('Classic Poutine', 'Poutine Classique'),
      description: t(
        'Our classic poutine with fries, extra cheese curds, and gravy',
        'Notre poutine classique avec frites, fromage en grains extra et sauce brune',
      ),
      className: 'object-bottom',
    },
    {
      src: '/images/food/grilled-chicken-burger-piri-piri.avif',
      alt: t(
        'Grilled Chicken Burger Piri Piri',
        'Burger Poulet grillé Piri Piri ',
      ),
      description: t(
        'Our Grilled Chicken Burger Piri Piri with grilled chicken, piri piri sauce, lettuce, tomatoes and cheese',
        'Notre burger poulet grillé Piri Piri avec poulet grillé, sauce piri piri, laitue, tomates et fromage',
      ),
    },
    {
      src: '/images/food/southwest-club-grilled-chicken.avif',
      alt: t('Southwest Club Grilled Chicken', 'Club Sud-Ouest Poulet Grillé'),
      description: t(
        'Our Southwest Club Grilled Chicken with bacon, lettuce, tomatoes, swiss cheese and our homemade spicy southwest mayo sauce',
        'Notre Club sud-ouest poulet grillé avec bacon, laitue, tomates, fromage suisse et notre sauce mayo épicée fait maison sud ouest',
      ),
    },
    {
      src: '/images/food/grilled-cheese-smoked-meat.avif',
      alt: t('Grilled Cheese Smoked Meat', 'Grilled Cheese Smoked Meat'),
      description: t(
        'Our Grilled Cheese Smoked Meat with smoked meat, swiss cheese, and mustard',
        'Notre Grilled Cheese Smoked Meat avec viande fumée, fromage suisse et moutarde',
      ),
    },
    {
      src: '/images/food/veggie-burger.avif',
      alt: t('Veggie Burger', 'Burger Végétarien'),
      description: t(
        'Homemade with pico de gallo, lettuce, and guacamole - and an amazing chickpea gallete',
        'Fait maison avec pico de gallo, laitue et guacamole - et une galette de pois chiche incroyable',
      ),
      className: 'object-bottom',
    },
    {
      src: '/images/food/famous-crepes.avif',
      alt: t('Crepe Supreme', 'Crêpe Suprême'),
      description: t(
        'Our famous crepe with strawberries, banana, nutella and our custard cream',
        'Notre fameuse crêpe avec fraises, banane, nutella et notre crème anglaise',
      ),
    },
    {
      src: '/images/food/omelette-compagnarde.avif',
      alt: t('Omelette Compagnarde', 'Omelette Compagnarde'),
      description: t(
        'Our Compagnarde Omelette with 3 eggs, sausages, bacon, ham, potatoes and cheese',
        'Notre omelette compagnarde avec 3 œufs, saucisses, bacons, jambons, patates et fromage',
      ),
    },
    {
      src: '/images/food/homemade-meat-sauce.avif',
      alt: t('Homemade Meat Sauce', 'Sauce Viande Fait Maison'),
      description: t(
        'Our Homemade Meat Sauce since 1980',
        'Notre sauce viande fait maison depuis 1980',
      ),
      className: 'object-top',
    },
    {
      src: '/images/food/swag.avif',
      alt: t('Swag', 'Swag'),
      description: t(
        'Get our exclusive merch and support our local business',
        'Obtenez notre merch exclusive et soutenez notre entreprise locale',
      ),
    },
  ];

  return (
    <section
      id="menu"
      className="scroll-mt-20 bg-white py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-space-grotesk bg-secondary neo-brutalist mb-4 inline-block -rotate-1 p-4 text-4xl font-black lg:text-5xl">
            {t('OUR MENU', 'NOTRE MENU')}
          </h2>
          <p className="mx-auto my-8 max-w-2xl text-2xl font-bold">
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
                      <div className="relative flex size-full flex-col">
                        <img
                          src={image.src || '/placeholder.svg'}
                          alt={image.alt}
                          loading="lazy"
                          className={cn(
                            'aspect-square flex-1 object-cover',
                            image.className,
                          )}
                        />
                        <div className="w-full bg-black p-4 text-white">
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
                  href="/menu.pdf"
                  target="_blank"
                >
                  <Button
                    variant="neo"
                    size="lg"
                    className="gap-2"
                  >
                    <FileText size={18} />
                    {t('View Menu', 'Voir le Menu')}
                  </Button>
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
