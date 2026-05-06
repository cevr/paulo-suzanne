import { Effect } from 'effect';
import { Form, redirect, useActionData } from 'react-router';

import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { Auth, BadPassword } from '~/services/Auth';

export const meta = () => [{ name: 'robots', content: 'noindex, nofollow' }];

export const loader = routeHandler(function* () {
  const { request } = yield* ReactRouterContext;
  const auth = yield* Auth;
  return yield* auth.checkCookie(request.headers.get('cookie')).pipe(
    Effect.match({
      onSuccess: () => redirect('/admin'),
      onFailure: () => null,
    }),
  );
});

export const action = routeAction(function* () {
  const { request } = yield* ReactRouterContext;
  const auth = yield* Auth;
  const form = yield* Effect.tryPromise(() => request.formData());
  const password = String(form.get('password') ?? '');

  return yield* auth.verifyPassword(password).pipe(
    Effect.match({
      onSuccess: (token) =>
        redirect('/admin', {
          headers: { 'Set-Cookie': auth.cookieHeader(token) },
        }),
      onFailure: (e) =>
        e instanceof BadPassword
          ? Response.json({ error: 'Wrong password' }, { status: 401 })
          : Response.json({ error: 'Login failed' }, { status: 500 }),
    }),
  );
});

export default function Login() {
  const data = useActionData<typeof action>() as { error?: string } | undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 sm:p-6">
      <Form
        method="post"
        className="w-full max-w-sm space-y-5 rounded-lg bg-white p-5 shadow sm:p-6"
      >
        <h1 className="text-xl font-semibold">Admin login</h1>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Password</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            className="block w-full rounded-md border border-neutral-300 px-3 py-3 text-base focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
          />
        </label>
        {data?.error ? (
          <p role="alert" className="text-sm text-red-600">
            {data.error}
          </p>
        ) : null}
        <button
          type="submit"
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        >
          Sign in
        </button>
      </Form>
    </main>
  );
}
