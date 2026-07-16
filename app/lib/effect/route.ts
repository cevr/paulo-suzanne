import { Effect } from 'effect';

import { ReactRouterContext, type RouteArgs } from './router-context';
import type { AppServices } from './runtime';

type RouteServices = AppServices | ReactRouterContext;

export const routeHandler =
  <Eff extends Effect.Effect<unknown, unknown, RouteServices>, A>(
    body: () => Generator<Eff, A, never>,
  ) =>
  (args: RouteArgs): Promise<A> =>
    args.context.runtime.run(args, Effect.gen(body));

export const routeAction =
  <Eff extends Effect.Effect<unknown, unknown, RouteServices>, A>(
    body: () => Generator<Eff, A, never>,
  ) =>
  (args: RouteArgs): Promise<A> =>
    args.context.runtime.run(args, Effect.gen(body));
