import {
  createCookie,
  unstable_createContext,
  unstable_RouterContextProvider,
  type unstable_MiddlewareFunction,
} from 'react-router';
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

export const getLanguage = async (context: unstable_RouterContextProvider) => {
  return context.get(cookieContext);
};

export const LanguageMiddleware: unstable_MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const cookieHeader = request.headers.get('Cookie');
  const cookieValue = await langCookie.parse(cookieHeader);
  const lang = cookieValue || 'fr';
  context.set(cookieContext, lang);
  return next();
};
