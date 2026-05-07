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
import { imageSrc } from '~/content/schema';

import { useContent, useLanguage } from '../lib/language-provider';

export function MenuSection() {
  const lang = useLanguage();
  const { menu } = useContent();

  return (
    <section
      id="menu"
      className="scroll-mt-20 bg-white py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-space-grotesk bg-secondary neo-brutalist mb-4 inline-block -rotate-1 p-4 text-4xl font-black lg:text-5xl">
            {menu.heading[lang]}
          </h2>
          <p className="mx-auto my-8 max-w-2xl text-2xl font-bold">
            {menu.intro[lang]}
          </p>

          {/* Food Image Carousel */}
          <div className="mx-auto mb-12 max-w-3xl">
            <Carousel>
              <div className="neo-brutalist overflow-hidden">
                <CarouselContent>
                  {menu.carousel.map((item) => (
                    <CarouselItem key={item.image.key}>
                      <div className="relative flex size-full flex-col">
                        <img
                          src={imageSrc(item.image)}
                          alt={item.image.alt[lang]}
                          width={item.image.width}
                          height={item.image.height}
                          loading="lazy"
                          className="aspect-square flex-1 object-cover"
                        />
                        <div className="w-full bg-black p-4 text-white">
                          <h3 className="font-space-grotesk text-xl font-bold">
                            {item.image.alt[lang]}
                          </h3>
                          <p>{item.description[lang]}</p>
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
                {menu.pdfHeading[lang]}
              </h3>
              <p className="mb-6 text-center">{menu.pdfBody[lang]}</p>

              <div className="flex gap-4">
                <a
                  href={menu.pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="neo"
                    size="lg"
                    className="gap-2"
                  >
                    <FileText size={18} />
                    {menu.pdfCta[lang]}
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">{menu.disclaimer[lang]}</p>
        </div>
      </div>
    </section>
  );
}
