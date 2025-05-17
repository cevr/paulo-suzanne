

import { MapPin, Clock } from "lucide-react"
import { useLanguage } from "./language-provider"

export function LocationSection() {
  const { t } = useLanguage()

  const hours = [
    { day: t("Monday", "Lundi"), hours: t("Open 24 Hours", "Ouvert 24 Heures") },
    { day: t("Tuesday", "Mardi"), hours: t("Open 24 Hours", "Ouvert 24 Heures") },
    { day: t("Wednesday", "Mercredi"), hours: t("Open 24 Hours", "Ouvert 24 Heures") },
    { day: t("Thursday", "Jeudi"), hours: t("Open 24 Hours", "Ouvert 24 Heures") },
    { day: t("Friday", "Vendredi"), hours: t("Open 24 Hours", "Ouvert 24 Heures") },
    { day: t("Saturday", "Samedi"), hours: t("Open 24 Hours", "Ouvert 24 Heures") },
    { day: t("Sunday", "Dimanche"), hours: t("Open 24 Hours", "Ouvert 24 Heures") },
  ]

  return (
    <section id="location" className="py-20 bg-white scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="inline-block text-4xl md:text-5xl font-space-grotesk font-black mb-4 bg-secondary p-4 neo-brutalist rotate-[1deg]">
            {t("FIND US", "NOUS TROUVER")}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div>
            <div className="neo-brutalist overflow-hidden h-[400px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2794.3133186774316!2d-73.6394359!3d45.5339675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cc91f0d7a25b70f%3A0x2f95c2f8d692c8e0!2sPaolo%20%26%20Suzanne!5e0!3m2!1sen!2sca!4v1715962921!5m2!1sen!2sca"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t("Paolo & Suzanne location map", "Carte de l'emplacement de Paolo & Suzanne")}
              ></iframe>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-muted p-6 neo-brutalist-sm">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-space-grotesk font-bold mb-2">{t("Address", "Adresse")}</h3>
                  <p className="text-lg">
                    10721 Bd Pie-IX
                    <br />
                    Montréal, QC H1H 4A9
                    <br />
                    Canada
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-6 neo-brutalist-sm">
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-space-grotesk font-bold mb-2">{t("Hours", "Heures d'ouverture")}</h3>
                  <div className="space-y-1">
                    {hours.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-medium">{item.day}</span>
                        <span>{item.hours}</span>
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
  )
}
