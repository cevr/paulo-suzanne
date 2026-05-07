import { imageSrc } from '~/content/schema';

import { useContent, useLanguage } from '../lib/language-provider';

export function AboutSection() {
  const lang = useLanguage();
  const { about } = useContent();

  return (
    <section
      id="about"
      className="bg-muted scroll-mt-20 overflow-x-hidden py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <div className="bg-primary neo-brutalist-yellow mb-6 inline-block rotate-[-2deg] p-4">
                <h2 className="font-space-grotesk text-3xl font-black text-white lg:text-4xl">
                  {about.heading[lang]}
                </h2>
              </div>

              <div className="space-y-6">
                <h3 className="font-space-grotesk text-2xl font-bold">
                  {about.subheading[lang]}
                </h3>

                <p className="text-lg">{about.intro[lang]}</p>

                <div className="neo-brutalist-sm bg-white p-6">
                  <h4 className="font-space-grotesk mb-3 text-xl font-bold">
                    {about.storyHeading[lang]}
                  </h4>
                  <ul className="space-y-2">
                    {about.storyBullets.map((bullet, index) => (
                      <li
                        key={index}
                        className="flex items-start"
                      >
                        <span className="text-primary mr-2 font-bold">•</span>
                        <p>{bullet[lang]}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="neo-brutalist-sm bg-white p-6">
                  <h4 className="font-space-grotesk mb-3 text-xl font-bold">
                    {about.valuesHeading[lang]}
                  </h4>
                  <ul className="space-y-2">
                    {about.valueBullets.map((bullet, index) => (
                      <li
                        key={index}
                        className="flex items-start"
                      >
                        <span className="text-primary mr-2 font-bold">•</span>
                        <p>{bullet[lang]}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <div className="neo-brutalist-red aspect-square rotate-[2deg] bg-white p-4">
                  <div className="h-full w-full bg-gray-200">
                    <img
                      src={imageSrc(about.image)}
                      alt={about.image.alt[lang]}
                      width={about.image.width}
                      height={about.image.height}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="bg-secondary neo-brutalist absolute -right-4 -bottom-8 rotate-[-3deg] p-4 lg:-right-8">
                  <p className="font-space-grotesk text-2xl font-black">
                    {about.since[lang]}
                  </p>
                </div>
              </div>

              <div className="neo-brutalist bg-white p-6">
                <h4 className="font-space-grotesk mb-3 text-xl font-bold">
                  {about.promiseHeading[lang]}
                </h4>
                <p className="text-lg">{about.promise[lang]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
