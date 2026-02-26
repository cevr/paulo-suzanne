import { useTransition } from 'react';
import { Form } from 'react-router';

import { Button } from '~/components/ui/button';

import { useLanguage, useSetLanguage } from '../lib/language-provider';

export function LanguageSwitcher() {
  const [_, startTransition] = useTransition();
  const language = useLanguage();
  const setLanguage = useSetLanguage();

  return (
    <Form
      action="/lang"
      method="post"
      navigate={false}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="neo"
          color={language === 'fr' ? 'red' : 'white'}
          size="sm"
          onClick={() => startTransition(() => setLanguage('fr'))}
          className="font-bold"
          name="lang"
          value="fr"
          aria-pressed={language === 'fr'}
        >
          FR
        </Button>
        <Button
          variant="neo"
          color={language === 'en' ? 'red' : 'white'}
          size="sm"
          onClick={() => setLanguage('en')}
          className="font-bold"
          name="lang"
          value="en"
          aria-pressed={language === 'en'}
        >
          EN
        </Button>
      </div>
    </Form>
  );
}
