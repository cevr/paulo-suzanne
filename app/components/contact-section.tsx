import { Facebook, Instagram, Mail, Phone } from 'lucide-react';

import { Input } from '~/components/ui/input';
import { NeoButton } from '~/components/ui/neo-button';
import { Textarea } from '~/components/ui/textarea';

import { useLanguage } from '../lib/language-provider';

export function ContactSection() {
  const { t } = useLanguage();

  return (
    <section
      id="contact"
      className="bg-secondary relative scroll-mt-24 py-20"
    >
      <div className="retro-pattern absolute inset-0"></div>
      <div className="relative container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-space-grotesk neo-brutalist-red mb-4 inline-block -rotate-1 bg-white p-4 text-4xl font-black md:text-5xl">
            {t('CONTACT US', 'CONTACTEZ-NOUS')}
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
          <div className="neo-brutalist bg-white p-8">
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
                  <p className="text-lg">(514) 322-6336</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Mail className="text-primary h-6 w-6" />
                <div>
                  <h4 className="text-lg font-medium">
                    {t('Email', 'Courriel')}
                  </h4>
                  <p className="text-lg">info@paoloetsuzanne.com</p>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="mb-4 text-lg font-medium">
                  {t('Follow Us', 'Suivez-nous')}
                </h4>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="bg-primary neo-brutalist-sm btn-hover-effect-sm hover:bg-primary/90 rounded-full p-3 text-white transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a
                    href="#"
                    className="bg-primary neo-brutalist-sm btn-hover-effect-sm hover:bg-primary/90 rounded-full p-3 text-white transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="neo-brutalist bg-white p-8">
            <h3 className="font-space-grotesk mb-6 text-2xl font-bold">
              {t('Send a Message', 'Envoyez un Message')}
            </h3>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-medium"
                  >
                    {t('Name', 'Nom')}
                  </label>
                  <Input
                    id="name"
                    placeholder={t('Your name', 'Votre nom')}
                    className="neo-brutalist-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium"
                  >
                    {t('Email', 'Courriel')}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('Your email', 'Votre courriel')}
                    className="neo-brutalist-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-1 block text-sm font-medium"
                >
                  {t('Subject', 'Sujet')}
                </label>
                <Input
                  id="subject"
                  placeholder={t('Message subject', 'Sujet du message')}
                  className="neo-brutalist-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1 block text-sm font-medium"
                >
                  {t('Message', 'Message')}
                </label>
                <Textarea
                  id="message"
                  placeholder={t('Your message', 'Votre message')}
                  rows={5}
                  className="neo-brutalist-sm"
                />
              </div>

              <NeoButton
                type="submit"
                className="w-full"
              >
                {t('Send Message', 'Envoyer le Message')}
              </NeoButton>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
