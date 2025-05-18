'use client';

import { useLanguage } from '~/lib/language-provider';

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section
      id="about"
      className="bg-muted scroll-mt-24 overflow-x-hidden py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <div className="bg-primary neo-brutalist-yellow mb-6 inline-block rotate-[-2deg] p-4">
                <h2 className="font-space-grotesk text-3xl font-black text-white md:text-4xl">
                  {t('OUR STORY', 'NOTRE HISTOIRE')}
                </h2>
              </div>

              <div className="space-y-6">
                <h3 className="font-space-grotesk text-2xl font-bold">
                  {t(
                    'Paulo et Suzanne: Your 24-Hour Poutine Parlor',
                    'Paulo et Suzanne: Votre Casse-Croûte 24 Heures',
                  )}
                </h3>

                <p className="text-lg">
                  {t(
                    "Born in 1980 out of friendship—and the irresistible pull of golden fries—Paulo et Suzanne has been Quebec City's go-to casse-croûte for over four decades.",
                    "Né en 1980 d'une amitié—et de l'attrait irrésistible des frites dorées—Paulo et Suzanne est le casse-croûte incontournable de Québec depuis plus de quatre décennies.",
                  )}
                </p>

                <div className="neo-brutalist-sm bg-white p-6">
                  <h4 className="font-space-grotesk mb-3 text-xl font-bold">
                    {t('How we started', 'Comment nous avons commencé')}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-primary mr-2 font-bold">•</span>
                      <p>
                        {t(
                          'March 18, 1980: Three friends—Suzanne, Andrie and Jocelyn—opened our doors across from Sacré-Coeur Hospital.',
                          "18 mars 1980: Trois amis—Suzanne, Andrie et Jocelyn—ont ouvert nos portes en face de l'Hôpital Sacré-Cœur.",
                        )}
                      </p>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 font-bold">•</span>
                      <p>
                        {t(
                          "October 2003: Suzanne handed the reins to Manon and Angelo… but never left the kitchen! She's still here, serving up smiles (and fries) to this day.",
                          "Octobre 2003: Suzanne a passé les rênes à Manon et Angelo... mais n'a jamais quitté la cuisine! Elle est toujours là, servant des sourires (et des frites) jusqu'à ce jour.",
                        )}
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="neo-brutalist-sm bg-white p-6">
                  <h4 className="font-space-grotesk mb-3 text-xl font-bold">
                    {t('What makes us tick', 'Ce qui nous anime')}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-primary mr-2 font-bold">•</span>
                      <p>
                        {t(
                          'Fun & Fast-Paced: A high-energy vibe, 24/7.',
                          'Amusant et Rapide: Une ambiance énergique, 24/7.',
                        )}
                      </p>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 font-bold">•</span>
                      <p>
                        {t(
                          'Friendly Faces: Attentive staff who know your order by heart.',
                          'Visages Amicaux: Un personnel attentif qui connaît votre commande par cœur.',
                        )}
                      </p>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 font-bold">•</span>
                      <p>
                        {t(
                          'Fresh & Flavorful: Only top-quality ingredients go into every poutine.',
                          'Frais et Savoureux: Seuls des ingrédients de première qualité entrent dans chaque poutine.',
                        )}
                      </p>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 font-bold">•</span>
                      <p>
                        {t(
                          'Spotless Space: We keep our restaurant as clean as our reputation.',
                          'Espace Impeccable: Nous gardons notre restaurant aussi propre que notre réputation.',
                        )}
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <div className="neo-brutalist-red aspect-square rotate-[2deg] bg-white p-4">
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
                <div className="bg-secondary neo-brutalist absolute -right-4 -bottom-8 rotate-[-3deg] p-4 md:-right-8">
                  <p className="font-space-grotesk text-2xl font-black">
                    {t('SINCE 1980', 'DEPUIS 1980')}
                  </p>
                </div>
              </div>

              <div className="neo-brutalist bg-white p-6">
                <h4 className="font-space-grotesk mb-3 text-xl font-bold">
                  {t('Our promise', 'Notre promesse')}
                </h4>
                <p className="text-lg">
                  {t(
                    "If you're not thrilled with your meal, let us know—we'll fix it on the spot or refund your money. Because excellence isn't just a goal; it's our commitment to you.",
                    "Si vous n'êtes pas satisfait de votre repas, faites-le nous savoir—nous le corrigerons sur place ou vous rembourserons. Parce que l'excellence n'est pas seulement un objectif; c'est notre engagement envers vous.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
