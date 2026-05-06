import { redirect } from 'react-router';

import { routeAction, routeHandler } from '~/lib/effect/route';
import { Auth } from '~/services/Auth';

export const action = routeAction(function* () {
  const auth = yield* Auth;
  return redirect('/admin/login', {
    headers: { 'Set-Cookie': auth.clearCookieHeader() },
  });
});

export const loader = routeHandler(function* () {
  return redirect('/admin');
});
