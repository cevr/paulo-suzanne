import { Clock, MapPin } from 'lucide-react';

import { useTranslate } from '../lib/language-provider';

export function LocationSection() {
  const t =useTranslate();
  const hours = [
    { day: t('Monday', 'Lundi'), hours: t('10am to 3am', '10h à 3h') },
    { day: t('Tuesday', 'Mardi'), hours: t('10am to 3am', '10h à 3h') },
    { day: t('Wednesday', 'Mercredi'), hours: t('10am to 3am', '10h à 3h') },
    { day: t('Thursday', 'Jeudi'), hours: t('10am to 3am', '10h à 3h') },
    {
      day: t('Friday', 'Vendredi'),
      hours: t(
        'Opens at 10am (stays open overnight)',
        'Ouvre à 10h (reste ouvert toute la nuit)',
      ),
    },
    {
      day: t('Saturday', 'Samedi'),
      hours: t('Open 24 hours', 'Ouvert 24 heures'),
    },
    {
      day: t('Sunday', 'Dimanche'),
      hours: t('Open until 3am Monday', "Ouvert jusqu'à 3h lundi"),
    },
  ];

  return (
    <section
      id="location"
      className="scroll-mt-20 bg-white py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-space-grotesk bg-secondary neo-brutalist mb-4 inline-block rotate-1 p-4 text-4xl font-black lg:text-5xl">
            {t('FIND US', 'NOUS TROUVER')}
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <div className="neo-brutalist h-[460px] overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed/v1/place?q=5501+Boul+Gouin+O,+Montréal,+QC+H4J+1C8,+Canada&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t(
                  'Paulo & Suzanne location map',
                  "Carte de l'emplacement de Paulo & Suzanne",
                )}
              ></iframe>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-muted neo-brutalist-sm p-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-primary mt-1 h-6 w-6 shrink-0" />
                <div>
                  <h3 className="font-space-grotesk mb-2 text-xl font-bold">
                    {t('Address', 'Adresse')}
                  </h3>
                  <p className="text-lg">
                    5501 Boul Gouin O
                    <br />
                    Montréal, QC H4J 1C8
                    <br />
                    Canada
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted neo-brutalist-sm p-6 pr-12">
              <div className="flex items-start gap-4">
                <Clock className="text-primary mt-1 h-6 w-6 shrink-0" />
                <div className="flex flex-1 flex-col">
                  <h3 className="font-space-grotesk mb-2 text-xl font-bold">
                    {t('Hours', "Heures d'ouverture")}
                  </h3>
                  <div className="gap-1">
                    {hours.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between"
                      >
                        <span className="font-medium">{item.day}</span>
                        <span className="text-right">{item.hours}</span>
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
