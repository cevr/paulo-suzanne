import { MenuIcon, XIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import { imageSrc } from '~/content/schema';

import { useContent, useLanguage } from '../lib/language-provider';
import { LanguageSwitcher } from './language-switcher';

export function Header() {
  const [_, startTransition] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lang = useLanguage();
  const { header } = useContent();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="border-primary dark sticky top-0 z-50 border-b-4 bg-black text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center"
            >
              <img
                src={imageSrc(header.logo)}
                alt={header.logo.alt[lang]}
                width={header.logo.width}
                height={header.logo.height}
                className="h-12 w-auto"
              />
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-6 lg:flex">
              {header.navLinks.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="font-space-grotesk hover:text-primary text-lg font-bold transition-colors"
                >
                  {item.label[lang]}
                </Link>
              ))}
            </div>

            <Button
              asChild
              variant="neo"
              color="red"
              size="lg"
              className="hidden text-xl lg:flex"
            >
              <a
                href={header.orderOnlineUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {header.orderLong[lang]}
              </a>
            </Button>

            {/* Mobile Order Button */}
            <Button
              asChild
              variant="neo"
              size="sm"
              className="px-2 py-1 text-lg lg:hidden"
            >
              <a
                href={header.orderOnlineUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {header.orderShort[lang]}
              </a>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                startTransition(() => toggleMenu());
              }}
              className="lg:hidden bg-transparent"
              aria-label={
                isMenuOpen ? header.closeMenuLabel[lang] : header.openMenuLabel[lang]
              }
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <XIcon className="size-6" />
              ) : (
                <MenuIcon className="size-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        data-visible={isMenuOpen ? '' : undefined}
        className="border-primary absolute top-20 right-0 left-0 hidden border-t-2 bg-black text-white data-visible:block lg:hidden"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {header.navLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="font-space-grotesk hover:text-primary py-2 text-xl font-bold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label[lang]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
