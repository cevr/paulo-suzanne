import { Cause, Effect, Exit, Layer, ManagedRuntime, Schema } from 'effect';
import { FetchHttpClient } from 'effect/unstable/http';
import { redirect } from 'react-router';

import { Content, ContentLoadError } from '~/content/loader';
import { Auth, Unauthorized } from '~/services/Auth';
import { Railway, RailwayDisabled, RailwayError } from '~/services/Railway';
import { NotFound, Storage, StorageError } from '~/services/Storage';

import { ReactRouterContext, type RouteArgs } from './router-context';

export type AppServices = Storage | Auth | Railway | Content;
export type AppError =
  | Response
  | Unauthorized
  | NotFound
  | StorageError
  | RailwayDisabled
  | RailwayError
  | ContentLoadError;

const RailwayLayer = Railway.layer.pipe(Layer.provideMerge(FetchHttpClient.layer));

const AppLayer = Layer.mergeAll(
  Storage.layer,
  Auth.layer,
  RailwayLayer,
  Content.layer,
);
const AppRuntime = ManagedRuntime.make(AppLayer);

const isResponse = (v: unknown): v is Response =>
  typeof v === 'object' && v !== null && v instanceof Response;

const reportServerError = (cause: Cause.Cause<unknown>): void => {
  Bun.stderr.write(`[paulo-suzanne] Effect error: ${Cause.pretty(cause)}\n`);
};

const throwHttpError = (error: unknown): never => {
  if (isResponse(error)) throw error;

  if (Schema.is(Unauthorized)(error)) {
    throw redirect('/admin/login');
  }
  if (Schema.is(NotFound)(error)) {
    throw new Response('Not Found', { status: 404 });
  }
  if (Schema.is(StorageError)(error)) {
    reportServerError(Cause.fail(error));
    throw new Response(JSON.stringify({ message: 'Storage error', op: error.op }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  reportServerError(Cause.die(error));
  throw new Response('Internal Server Error', { status: 500 });
};

const throwCauseError = (cause: Cause.Cause<unknown>): never => {
  for (const reason of cause.reasons) {
    if (Cause.isFailReason(reason)) throwHttpError(reason.error);
    if (Cause.isDieReason(reason) && isResponse(reason.defect)) throw reason.defect;
  }

  reportServerError(cause);
  throw new Response('Internal Server Error', { status: 500 });
};

export type RequestRuntime = {
  readonly run: <A, E, R extends AppServices | ReactRouterContext>(
    args: RouteArgs,
    effect: Effect.Effect<A, E, R>,
  ) => Promise<A>;
};

const runWithContext = <A, E, R extends AppServices | ReactRouterContext>(
  args: RouteArgs,
  effect: Effect.Effect<A, E, R>,
): Promise<A> => {
  const provided = effect.pipe(Effect.provideService(ReactRouterContext, args)) as Effect.Effect<
    A,
    E,
    AppServices
  >;
  return AppRuntime.runPromiseExit(provided).then((exit) => {
    if (Exit.isSuccess(exit)) return exit.value;
    return throwCauseError(exit.cause);
  });
};

export const makeRequestRuntime = (): RequestRuntime => ({
  run: runWithContext,
});

export const disposeAppRuntime = (): Promise<void> => AppRuntime.dispose();
