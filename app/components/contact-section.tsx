import { Facebook, Instagram, Mail, Phone } from 'lucide-react';

import { useLanguage } from '../lib/language-provider';

export function ContactSection() {
  const { t } = useLanguage();

  return (
    <section
      id="contact"
      className="bg-secondary relative scroll-mt-20 py-20"
    >
      <div className="retro-pattern absolute inset-0"></div>
      <div className="relative container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-space-grotesk neo-brutalist-red mb-4 inline-block -rotate-1 bg-white p-4 text-4xl font-black md:text-5xl">
            {t('CONTACT US', 'CONTACTEZ-NOUS')}
          </h2>
        </div>

        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12">
          <div className="neo-brutalist bg-white p-8 md:min-w-xl">
            <h3 className="font-space-grotesk mb-6 text-2xl font-bold">
              {t('Get in Touch', 'Entrez en Contact')}
            </h3>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Phone className="text-primary h-6 w-6" />
                <div>
                  <h4 className="text-lg font-medium">
                    {t('Phone', 'Téléphone')}
                  </h4>
                  <a
                    href="tel:+15143365561"
                    className="text-lg"
                  >
                    (514) 336-5561
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Mail className="text-primary h-6 w-6" />
                <div>
                  <h4 className="text-lg font-medium">
                    {t('Email', 'Courriel')}
                  </h4>
                  <a
                    href="mailto:info@pauloetsuzanne.com"
                    className="text-lg"
                  >
                    info@pauloetsuzanne.com
                  </a>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="mb-4 text-lg font-medium">
                  {t('Follow Us', 'Suivez-nous')}
                </h4>
                <div className="flex gap-4">
                  <a
                    href="https://www.instagram.com/pauloetsuzanne_officiel/"
                    className="bg-primary neo-brutalist-sm btn-hover-effect-sm hover:bg-primary/90 rounded-full p-3 text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a
                    href="https://www.facebook.com/pauloetsuzanne247/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary neo-brutalist-sm btn-hover-effect-sm hover:bg-primary/90 rounded-full p-3 text-white transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
