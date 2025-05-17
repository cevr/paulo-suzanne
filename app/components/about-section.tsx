

import Image from "next/image"
import { useLanguage } from "./language-provider"

export function AboutSection() {
  const { t } = useLanguage()

  return (
    <section id="about" className="py-20 bg-muted scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-primary p-4 mb-6 rotate-[-2deg] neo-brutalist-yellow">
                <h2 className="text-3xl md:text-4xl font-space-grotesk font-black text-white">
                  {t("OUR STORY", "NOTRE HISTOIRE")}
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-lg">
                  {t(
                    "Paolo & Suzanne has been a Quebec institution since 1980, serving delicious poutine, burgers, and sandwiches 24 hours a day, 7 days a week.",
                    "Paolo & Suzanne est une institution québécoise depuis 1980, servant de délicieuses poutines, burgers et sandwichs 24 heures sur 24, 7 jours sur 7.",
                  )}
                </p>
                <p className="text-lg">
                  {t(
                    "What started as a small diner has grown into a beloved establishment known for its authentic Quebec comfort food and welcoming atmosphere.",
                    "Ce qui a commencé comme un petit restaurant est devenu un établissement bien-aimé connu pour sa cuisine réconfortante québécoise authentique et son atmosphère accueillante.",
                  )}
                </p>
                <p className="text-lg font-bold">
                  {t(
                    "Over 40 years of serving the best poutine in town!",
                    "Plus de 40 ans à servir la meilleure poutine en ville!",
                  )}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-white p-4 neo-brutalist-red rotate-[2deg]">
                <div className="w-full h-full bg-gray-200">
                  <Image
                    src="/retro-diner-red-booths.png"
                    alt={t("Paolo & Suzanne restaurant interior", "Intérieur du restaurant Paolo & Suzanne")}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 bg-secondary p-4 neo-brutalist rotate-[-3deg]">
                <p className="text-2xl font-space-grotesk font-black">{t("SINCE 1980", "DEPUIS 1980")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
