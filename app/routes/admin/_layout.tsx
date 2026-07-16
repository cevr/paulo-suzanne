import { LogOut, Utensils } from 'lucide-react';
import { Form, Link, Outlet } from 'react-router';

import { Button } from '~/components/ui/button';
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
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-neutral-900 text-white">
              <Utensils className="size-5" aria-hidden />
            </span>
            <Link
              to="/admin"
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <span className="block text-sm font-semibold text-neutral-950">
                Paulo &amp; Suzanne
              </span>
              <span className="block text-xs text-neutral-500">
                Website editor
              </span>
            </Link>
          </div>
          <Form method="post" action="/admin/logout">
            <Button type="submit" variant="ghost" className="min-h-11">
              <LogOut aria-hidden />
              Sign out
            </Button>
          </Form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
