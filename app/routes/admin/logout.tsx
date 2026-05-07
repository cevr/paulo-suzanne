import { Effect } from 'effect';
import { redirect } from 'react-router';

import { adminSecurityHeaders } from '~/lib/admin-headers';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { Auth } from '~/services/Auth';

export const headers = adminSecurityHeaders;

export const action = routeAction(function* () {
  const auth = yield* Auth;
  return redirect('/admin/login', {
    headers: { 'Set-Cookie': auth.clearCookieHeader() },
  });
});

export const loader = routeHandler(function* () {
  yield* Effect.void;
  return redirect('/admin');
});
