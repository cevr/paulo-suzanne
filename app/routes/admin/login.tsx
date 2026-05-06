import { Effect } from 'effect';
import { Form, redirect, useActionData } from 'react-router';

import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { Auth, BadPassword } from '~/services/Auth';

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
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <Form method="post" className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Admin login</h1>
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-700">Password</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </label>
        {data?.error ? <p className="text-sm text-red-600">{data.error}</p> : null}
        <button
          type="submit"
          className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Sign in
        </button>
      </Form>
    </main>
  );
}
