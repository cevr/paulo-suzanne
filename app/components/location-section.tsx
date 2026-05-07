import { Clock, MapPin } from 'lucide-react';

import { useContent, useLanguage } from '../lib/language-provider';

export function LocationSection() {
  const lang = useLanguage();
  const { location } = useContent();

  return (
    <section
      id="location"
      className="scroll-mt-20 bg-white py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-space-grotesk bg-secondary neo-brutalist mb-4 inline-block rotate-1 p-4 text-4xl font-black lg:text-5xl">
            {location.heading[lang]}
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <div className="neo-brutalist h-[460px] overflow-hidden">
              <iframe
                src={location.mapEmbedSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={location.mapTitle[lang]}
              ></iframe>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-muted neo-brutalist-sm p-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-primary mt-1 h-6 w-6 shrink-0" />
                <div>
                  <h3 className="font-space-grotesk mb-2 text-xl font-bold">
                    {location.addressHeading[lang]}
                  </h3>
                  <address className="text-lg not-italic">
                    {location.addressLines.map((line, index) => (
                      <span key={line}>
                        {line}
                        {index < location.addressLines.length - 1 && <br />}
                      </span>
                    ))}
                  </address>
                </div>
              </div>
            </div>

            <div className="bg-muted neo-brutalist-sm p-6 pr-12">
              <div className="flex items-start gap-4">
                <Clock className="text-primary mt-1 h-6 w-6 shrink-0" />
                <div className="flex flex-1 flex-col">
                  <h3 className="font-space-grotesk mb-2 text-xl font-bold">
                    {location.hoursHeading[lang]}
                  </h3>
                  <div className="gap-1">
                    {location.hours.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between"
                      >
                        <span className="font-medium">{item.day[lang]}</span>
                        <span className="text-right">{item.hours[lang]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
