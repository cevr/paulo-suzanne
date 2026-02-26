import { MenuIcon, XIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';

import { useTranslate } from '../lib/language-provider';
import { LanguageSwitcher } from './language-switcher';

export function Header() {
  const [_, startTransition] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    {
      href: '#menu',
      label: t('Menu', 'Menu'),
    },
    {
      href: '#about',
      label: t('About', 'À propos'),
    },
    {
      href: '#location',
      label: t('Location', 'Emplacement'),
    },
    {
      href: '#contact',
      label: t('Contact', 'Contact'),
    },
  ];

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
                src="/images/logo-small.png"
                alt="Paulo & Suzanne"
                width={60}
                height={60}
                className="h-12 w-auto"
              />
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="font-space-grotesk hover:text-primary text-lg font-bold transition-colors"
                >
                  {item.label}
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
                href="https://order2.silverwarepos.com/app/PauloSuzanne#!/menu"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Order Online', 'Commander en ligne')}
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
                href="https://order2.silverwarepos.com/app/PauloSuzanne#!/menu"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Order', 'Commander')}
              </a>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                startTransition(() => toggleMenu());
              }}
              className="lg:hidden bg-transparent"
              aria-label={isMenuOpen ? t('Close menu', 'Fermer le menu') : t('Open menu', 'Ouvrir le menu')}
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="font-space-grotesk hover:text-primary py-2 text-xl font-bold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
