import type { ActionFunction } from 'react-router';
import { data } from 'react-router';

import type { Lang } from '~/lib/language';
import { setLanguage } from '~/lib/language.server';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const lang = formData.get('lang');
  if (!lang) {
    return data(null);
  }
  return data(null, {
    headers: {
      'Set-Cookie': await setLanguage(lang as Lang),
    },
  });
};
