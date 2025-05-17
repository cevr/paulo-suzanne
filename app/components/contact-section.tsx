

import { Phone, Mail, Instagram, Facebook } from "lucide-react"
import { useLanguage } from "./language-provider"
import { NeoButton } from "~/components/ui/neo-button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"

export function ContactSection() {
  const { t } = useLanguage()

  return (
    <section id="contact" className="py-20 bg-secondary scroll-mt-24">
      <div className="retro-pattern absolute inset-0 opacity-20"></div>
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <h2 className="inline-block text-4xl md:text-5xl font-space-grotesk font-black mb-4 bg-white p-4 neo-brutalist-red rotate-[-1deg]">
            {t("CONTACT US", "CONTACTEZ-NOUS")}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="bg-white p-8 neo-brutalist">
            <h3 className="text-2xl font-space-grotesk font-bold mb-6">{t("Get in Touch", "Entrez en Contact")}</h3>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="text-lg font-medium">{t("Phone", "Téléphone")}</h4>
                  <p className="text-lg">(514) 322-6336</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="text-lg font-medium">{t("Email", "Courriel")}</h4>
                  <p className="text-lg">info@paoloetsuzanne.com</p>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="text-lg font-medium mb-4">{t("Follow Us", "Suivez-nous")}</h4>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="bg-primary text-white p-3 rounded-full neo-brutalist-sm btn-hover-effect-sm hover:bg-primary/90 transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a
                    href="#"
                    className="bg-primary text-white p-3 rounded-full neo-brutalist-sm btn-hover-effect-sm hover:bg-primary/90 transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 neo-brutalist">
            <h3 className="text-2xl font-space-grotesk font-bold mb-6">{t("Send a Message", "Envoyez un Message")}</h3>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    {t("Name", "Nom")}
                  </label>
                  <Input id="name" placeholder={t("Your name", "Votre nom")} className="neo-brutalist-sm" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    {t("Email", "Courriel")}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("Your email", "Votre courriel")}
                    className="neo-brutalist-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                  {t("Subject", "Sujet")}
                </label>
                <Input
                  id="subject"
                  placeholder={t("Message subject", "Sujet du message")}
                  className="neo-brutalist-sm"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  {t("Message", "Message")}
                </label>
                <Textarea
                  id="message"
                  placeholder={t("Your message", "Votre message")}
                  rows={5}
                  className="neo-brutalist-sm"
                />
              </div>

              <NeoButton type="submit" className="w-full">
                {t("Send Message", "Envoyer le Message")}
              </NeoButton>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
