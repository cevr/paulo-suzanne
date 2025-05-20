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
      src: '/images/food/burger-guac.avif',
      alt: t('Burger Guac', 'Burger Guac'),
      description: t('Burger Guac', 'Burger Guac'),
    },
    {
      src: '/images/food/burger-poutine.avif',
      alt: t('Burger Poutine', 'Burger Poutine'),
      description: t('Burger Poutine', 'Burger Poutine'),
    },
    {
      src: '/images/food/burger.avif',
      alt: t('Burger', 'Burger'),
      description: t('Burger', 'Burger'),
    },
    {
      src: '/images/food/crepes.avif',
      alt: t('Crepe', 'Crepe'),
      description: t('Crepe', 'Crepe'),
    },
    {
      src: '/images/food/fries.avif',
      alt: t('Fries', 'Fries'),
      description: t('Fries', 'Fries'),
      className: 'object-top',
    },
    {
      src: '/images/food/hot-dogs-poutine.avif',
      alt: t('Hot Dogs Poutine', 'Hot Dogs Poutine'),
      description: t('Hot Dogs Poutine', 'Hot Dogs Poutine'),
    },
    {
      src: '/images/food/poutine-burger.avif',
      alt: t('Poutine Burger', 'Poutine Burger'),
      description: t('Poutine Burger', 'Poutine Burger'),
    },
    {
      src: '/images/food/montrealaise.avif',
      alt: t('Montrealais', 'Montrealais'),
      description: t('Montrealais', 'Montrealais'),
      className: 'object-top',
    },
  ];

  return (
    <section
      id="menu"
      className="scroll-mt-20 bg-white py-20"
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
                      <div className="relative flex size-full flex-col">
                        <img
                          src={image.src || '/placeholder.svg'}
                          alt={image.alt}
                          className={cn(
                            'aspect-16/9 flex-1 object-cover',
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
                  href="https://nebula.wsimg.com/d6f136992ba0c8cc1b43f24bb13938e2?AccessKeyId=4A810DB41D146C1A6336&disposition=0&alloworigin=1"
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
