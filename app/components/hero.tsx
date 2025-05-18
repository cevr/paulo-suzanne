import { Link } from 'react-router';

import { NeoButton } from '~/components/ui/neo-button';

import { useLanguage } from '../lib/language-provider';

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="bg-secondary relative overflow-hidden py-20 md:py-32">
      <div className="retro-pattern absolute inset-0"></div>
      <div className="relative z-10 container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="neo-brutalist mb-6 inline-block -rotate-2 bg-white p-4">
            <h1 className="font-space-grotesk text-primary text-4xl font-black md:text-6xl">
              {t('SINCE 1980', 'DEPUIS 1980')}
            </h1>
          </div>

          <h2 className="font-space-grotesk mb-6 text-5xl font-black text-black md:text-7xl">
            {t('LEGENDARY POUTINE & BURGERS', 'POUTINE & BURGERS LÉGENDAIRES')}
          </h2>

          <p className="neo-brutalist mb-8 inline-block rotate-1 bg-white p-4 text-xl font-bold md:text-2xl">
            {t(
              'Open 24/7 - The Original Casse-Croûte',
              "Ouvert 24/7 - L'Original Casse-Croûte",
            )}
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <NeoButton
              variant="default"
              size="lg"
              className="text-lg"
            >
              <Link to="#menu">{t('View Menu', 'Voir le Menu')}</Link>
            </NeoButton>
            <NeoButton
              variant="secondary"
              neoVariant="yellow"
              size="lg"
              className="text-lg"
            >
              {t('Order Online', 'Commander en ligne')}
            </NeoButton>
          </div>
        </div>
      </div>
    </section>
  );
}
