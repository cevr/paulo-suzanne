import {
  createCookie,
  unstable_createContext,
  unstable_RouterContextProvider,
  type unstable_MiddlewareFunction,
  type unstable_RouterContext,
} from 'react-router';
import { createTypedCookie } from 'remix-utils/typed-cookie';
import { z } from 'zod'; //or another Standard Schema compatible library

import { LangSchema, type Lang } from './language';

const cookie = createCookie('__ps_lang', {
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
});

const langCookie = createTypedCookie({
  cookie: cookie,
  schema: LangSchema,
});

let cookieContext = unstable_createContext<Lang>();

export const setLanguage = async (lang: Lang) => {
  return await langCookie.serialize(lang);
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
