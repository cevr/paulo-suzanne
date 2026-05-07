import { Link } from 'react-router';

import { imageSrc } from '~/content/schema';

import { useContent, useLanguage } from '../lib/language-provider';

export function Footer() {
  const lang = useLanguage();
  const { footer, contact, location } = useContent();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-primary border-t-4 bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link
              to="/"
              className="mb-4 inline-block"
            >
              <img
                src={imageSrc(footer.logo)}
                alt={footer.logo.alt[lang]}
                width={footer.logo.width}
                height={footer.logo.height}
                loading="lazy"
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-gray-400">{footer.tagline[lang]}</p>
          </div>

          <div>
            <h2 className="font-space-grotesk mb-4 text-xl font-bold">
              {footer.quickLinksHeading[lang]}
            </h2>
            <ul className="space-y-2">
              {footer.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-space-grotesk mb-4 text-xl font-bold">
              {footer.contactInfoHeading[lang]}
            </h2>
            <address className="flex flex-col gap-2 text-gray-400 not-italic">
              {footer.contactInfoLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <a
                href={`tel:${contact.phoneTel}`}
                className="text-white"
              >
                {contact.phoneDisplay}
              </a>
              <a
                href={`mailto:${contact.emailAddress}`}
                className="text-white"
              >
                {contact.emailAddress}
              </a>
            </address>
          </div>

          <div>
            <h2 className="font-space-grotesk mb-4 text-xl font-bold">
              {location.hoursHeading[lang]}
            </h2>
            <ul className="font-space-grotesk flex flex-col gap-1 text-gray-400">
              {location.hours.map((row, index) => (
                <li
                  key={index}
                  className="flex justify-between gap-4"
                >
                  <span className="font-medium">{row.day[lang]}</span>
                  <span className="text-right">{row.hours[lang]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-500">
          <p>
            © {currentYear} Paulo & Suzanne. {footer.rightsLine[lang]}
          </p>
        </div>
      </div>
    </footer>
  );
}
