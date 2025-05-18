import { useLanguage } from '../lib/language-provider';

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section
      id="about"
      className="bg-muted scroll-mt-24 py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="bg-primary neo-brutalist-yellow mb-6 inline-block -rotate-2 p-4">
                <h2 className="font-space-grotesk text-3xl font-black text-white md:text-4xl">
                  {t('OUR STORY', 'NOTRE HISTOIRE')}
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-lg">
                  {t(
                    'Paolo & Suzanne has been a Quebec institution since 1980, serving delicious poutine, burgers, and sandwiches 24 hours a day, 7 days a week.',
                    'Paolo & Suzanne est une institution québécoise depuis 1980, servant de délicieuses poutines, burgers et sandwichs 24 heures sur 24, 7 jours sur 7.',
                  )}
                </p>
                <p className="text-lg">
                  {t(
                    'What started as a small diner has grown into a beloved establishment known for its authentic Quebec comfort food and welcoming atmosphere.',
                    'Ce qui a commencé comme un petit restaurant est devenu un établissement bien-aimé connu pour sa cuisine réconfortante québécoise authentique et son atmosphère accueillante.',
                  )}
                </p>
                <p className="text-lg font-bold">
                  {t(
                    'Over 40 years of serving the best poutine in town!',
                    'Plus de 40 ans à servir la meilleure poutine en ville!',
                  )}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="neo-brutalist-red aspect-square rotate-2 bg-white p-4">
                <div className="h-full w-full bg-gray-200">
                  <img
                    src="/retro-diner-red-booths.png"
                    alt={t(
                      'Paolo & Suzanne restaurant interior',
                      'Intérieur du restaurant Paolo & Suzanne',
                    )}
                    width={500}
                    height={500}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="bg-secondary neo-brutalist absolute -right-8 -bottom-8 -rotate-3 p-4">
                <p className="font-space-grotesk text-2xl font-black">
                  {t('SINCE 1980', 'DEPUIS 1980')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
