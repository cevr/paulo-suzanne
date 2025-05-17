import { useState } from "react";

import { Menu, X } from "lucide-react";
import { useLanguage } from "./language-provider";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "~/components/ui/button";
import { NeoButton } from "~/components/ui/neo-button";
import { Link } from "react-router";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    {
      href: "#menu",
      label: t("Menu", "Menu"),
    },
    {
      href: "#about",
      label: t("About", "À propos"),
    },
    {
      href: "#location",
      label: t("Location", "Emplacement"),
    },
    {
      href: "#contact",
      label: t("Contact", "Contact"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-black">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img
                src="/images/logo.png"
                alt="Paolo & Suzanne"
                width={120}
                height={60}
                className="h-12 w-auto"
              />
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="font-space-grotesk text-lg font-bold hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <NeoButton variant="default" size="lg" className="hidden md:flex">
              {t("Order Online", "Commander en ligne")}
            </NeoButton>

            {/* Mobile Order Button */}
            <NeoButton
              variant="default"
              neoVariant="sm"
              size="sm"
              className="md:hidden text-xs px-2 py-1"
            >
              {t("Order", "Commander")}
            </NeoButton>

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
        <div className="md:hidden bg-white border-t-2 border-black">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="font-space-grotesk text-xl font-bold py-2 hover:text-primary transition-colors"
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
