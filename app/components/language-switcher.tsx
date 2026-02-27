import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import { useLanguage } from '../lib/language-provider';

export function LanguageSwitcher() {
  const language = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="neo"
        color={language === 'fr' ? 'red' : 'white'}
        size="sm"
        className="font-bold"
        aria-pressed={language === 'fr'}
      >
        <Link to="/">FR</Link>
      </Button>
      <Button
        asChild
        variant="neo"
        color={language === 'en' ? 'red' : 'white'}
        size="sm"
        className="font-bold"
        aria-pressed={language === 'en'}
      >
        <Link to="/en">EN</Link>
      </Button>
    </div>
  );
}
