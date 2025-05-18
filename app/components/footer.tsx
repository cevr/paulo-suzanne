import { Link } from "react-router";
import { useLanguage } from "../lib/language-provider";

export function Footer() {
  const { t } = useLanguage();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t-4 border-primary">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img
                src="/images/logo.png"
                alt="Paolo & Suzanne"
                width={150}
                height={75}
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-gray-400">
              {t(
                "Serving Quebec's favorite comfort food since 1980",
                "Servant la cuisine réconfortante préférée du Québec depuis 1980"
              )}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-space-grotesk font-bold mb-4">
              {t("Quick Links", "Liens Rapides")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="#menu"
                  className="hover:text-primary transition-colors"
                >
                  {t("Menu", "Menu")}
                </Link>
              </li>
              <li>
                <Link
                  to="#about"
                  className="hover:text-primary transition-colors"
                >
                  {t("About", "À propos")}
                </Link>
              </li>
              <li>
                <Link
                  to="#location"
                  className="hover:text-primary transition-colors"
                >
                  {t("Location", "Emplacement")}
                </Link>
              </li>
              <li>
                <Link
                  to="#contact"
                  className="hover:text-primary transition-colors"
                >
                  {t("Contact", "Contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-space-grotesk font-bold mb-4">
              {t("Contact Info", "Coordonnées")}
            </h3>
            <address className="not-italic space-y-2 text-gray-400">
              <p>10721 Bd Pie-IX</p>
              <p>Montréal, QC H1H 4A9</p>
              <p>Canada</p>
              <p className="text-white">(514) 322-6336</p>
            </address>
          </div>

          <div>
            <h3 className="text-xl font-space-grotesk font-bold mb-4">
              {t("Hours", "Heures d'ouverture")}
            </h3>
            <p className="text-xl font-space-grotesk font-bold text-secondary">
              {t("OPEN 24/7", "OUVERT 24/7")}
            </p>
            <p className="text-gray-400 mt-2">
              {t(
                "Open 24 hours a day, 7 days a week",
                "Ouvert 24 heures sur 24, 7 jours sur 7"
              )}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>
            © {currentYear} Paolo & Suzanne.{" "}
            {t("All rights reserved.", "Tous droits réservés.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
