import { Effect, Schema } from 'effect';
import { LockKeyhole, Utensils } from 'lucide-react';
import { Form, redirect, useActionData, useNavigation } from 'react-router';

import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { adminMeta, adminSecurityHeaders } from '~/lib/admin-headers';
import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { Auth, BadPassword } from '~/services/Auth';

export const meta = adminMeta;

export const headers = adminSecurityHeaders;

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
        Schema.is(BadPassword)(e)
          ? Response.json({ error: 'Wrong password' }, { status: 401 })
          : Response.json({ error: 'Login failed' }, { status: 500 }),
    }),
  );
});

export default function Login() {
  const data = useActionData<typeof action>() as { error?: string } | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f5] p-4 sm:p-6">
      <Form
        method="post"
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <span className="grid size-11 place-items-center rounded-xl bg-neutral-900 text-white">
          <Utensils className="size-5" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Sign in to update the Paulo &amp; Suzanne website.
        </p>
        <label htmlFor="password" className="mt-6 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-800">Password</span>
          <Input
            id="password"
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            className="h-11 text-base"
          />
        </label>
        {data?.error ? (
          <Alert variant="destructive" className="mt-4">
            <LockKeyhole />
            <AlertDescription>
              {data.error === 'Wrong password'
                ? 'That password was not recognized. Please try again.'
                : 'We could not sign you in. Please try again in a moment.'}
            </AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="submit"
          className="mt-5 h-11 w-full"
          disabled={submitting}
        >
          {submitting && <Spinner />}
          Sign in
        </Button>
      </Form>
    </main>
  );
}
