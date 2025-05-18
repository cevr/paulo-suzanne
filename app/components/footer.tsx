import { Link } from 'react-router';

import { useLanguage } from '../lib/language-provider';

export function Footer() {
  const { t } = useLanguage();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-primary border-t-4 bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link
              to="/"
              className="mb-4 inline-block"
            >
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
                'Servant la cuisine réconfortante préférée du Québec depuis 1980',
              )}
            </p>
          </div>

          <div>
            <h3 className="font-space-grotesk mb-4 text-xl font-bold">
              {t('Quick Links', 'Liens Rapides')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="#menu"
                  className="hover:text-primary transition-colors"
                >
                  {t('Menu', 'Menu')}
                </Link>
              </li>
              <li>
                <Link
                  to="#about"
                  className="hover:text-primary transition-colors"
                >
                  {t('About', 'À propos')}
                </Link>
              </li>
              <li>
                <Link
                  to="#location"
                  className="hover:text-primary transition-colors"
                >
                  {t('Location', 'Emplacement')}
                </Link>
              </li>
              <li>
                <Link
                  to="#contact"
                  className="hover:text-primary transition-colors"
                >
                  {t('Contact', 'Contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-space-grotesk mb-4 text-xl font-bold">
              {t('Contact Info', 'Coordonnées')}
            </h3>
            <address className="flex flex-col gap-2 text-gray-400 not-italic">
              <p>5501 Boul Gouin O</p>
              <p>Montréal, QC H4J 1C8</p>
              <p>Canada</p>
              <a
                href="tel:+15143365561"
                className="text-white"
              >
                (514) 336-5561
              </a>
              <a
                href="mailto:info@paoloetsuzanne.com"
                className="text-white"
              >
                info@paoloetsuzanne.com
              </a>
            </address>
          </div>

          <div>
            <h3 className="font-space-grotesk mb-4 text-xl font-bold">
              {t('Hours', "Heures d'ouverture")}
            </h3>
            <p className="font-space-grotesk text-secondary text-xl font-bold uppercase">
              {t(
                'Weekdays 10am-3am, Weekends 24/7',
                'En semaine 10h-3h, Fins de semaine 24/7',
              )}
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-500">
          <p>
            © {currentYear} Paolo & Suzanne.{' '}
            {t('All rights reserved.', 'Tous droits réservés.')}
          </p>
        </div>
      </div>
    </footer>
  );
}
