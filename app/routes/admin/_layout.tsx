import { Form, Link, Outlet } from 'react-router';

import { adminMeta, adminSecurityHeaders } from '~/lib/admin-headers';
import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeHandler } from '~/lib/effect/route';
import { Auth } from '~/services/Auth';

export const meta = adminMeta;

export const headers = adminSecurityHeaders;

export const loader = routeHandler(function* () {
  const { request } = yield* ReactRouterContext;
  const auth = yield* Auth;
  yield* auth.checkCookie(request.headers.get('cookie'));
  return null;
});

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/admin" className="text-lg font-semibold">
            Admin
          </Link>
          <Form method="post" action="/admin/logout">
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-neutral-300 px-4 text-sm font-medium transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              Sign out
            </button>
          </Form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
