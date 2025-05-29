import { createCookie, unstable_createContext } from 'react-router';
import { createTypedCookie } from 'remix-utils/typed-cookie';

import { LangSchema, type Lang } from './language';

const cookie = createCookie('__ps_lang');

const langCookie = createTypedCookie({
  cookie: cookie,
  schema: LangSchema,
});

let cookieContext = unstable_createContext<Lang>();

export const setLanguage = async (lang: Lang) => {
  const cookie = await langCookie.serialize(lang);
  return cookie;
};

export const getLanguage = async (request: Request) => {
  const cookieHeader = request.headers.get('Cookie');
  const cookieValue = await langCookie.parse(cookieHeader);
  return cookieValue || 'fr';
};
