import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import { NeoButton } from '~/components/ui/neo-button';

import { useLanguage } from '../lib/language-provider';
import { LanguageSwitcher } from './language-switcher';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();

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
                alt="Paolo & Suzanne"
                width={60}
                height={60}
                className="h-12 w-auto"
              />
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-6 md:flex">
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

            <a
              href="https://order2.silverwarepos.com/app/PauloSuzanne#!/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex"
            >
              <NeoButton
                variant="default"
                size="lg"
                className="hidden md:flex"
              >
                {t('Order Online', 'Commander en ligne')}
              </NeoButton>
            </a>

            {/* Mobile Order Button */}
            <a
              href="https://order2.silverwarepos.com/app/PauloSuzanne#!/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="md:hidden"
            >
              <NeoButton
                variant="default"
                neoVariant="sm"
                size="sm"
                className="px-2 py-1 text-xs md:hidden"
              >
                {t('Order', 'Commander')}
              </NeoButton>
            </a>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="md:hidden"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-primary border-t-2 bg-black text-white md:hidden">
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
      )}
    </header>
  );
}
