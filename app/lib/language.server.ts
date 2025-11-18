import { createCookie } from 'react-router';
import { createTypedCookie } from 'remix-utils/typed-cookie';

import { LangSchema, type Lang } from './language';

const cookie = createCookie('__ps_lang');

const langCookie = createTypedCookie({
  cookie: cookie,
  schema: LangSchema,
});

export const setLanguage = async (lang: Lang) => {
  const cookie = await langCookie.serialize(lang);
  return cookie;
};

export const getLanguage = async (request: Request) => {
  const cookieHeader = request.headers.get('Cookie');
  const cookieValue = await langCookie.parse(cookieHeader);
  return cookieValue || 'fr';
};
