import { Form, Link, Outlet } from 'react-router';

import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeHandler } from '~/lib/effect/route';
import { Auth } from '~/services/Auth';

export const loader = routeHandler(function* () {
  const { request } = yield* ReactRouterContext;
  const auth = yield* Auth;
  yield* auth.checkCookie(request.headers.get('cookie'));
  return null;
});

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/admin" className="text-lg font-semibold">
            Admin
          </Link>
          <Form method="post" action="/admin/logout">
            <button
              type="submit"
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              Sign out
            </button>
          </Form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
