import type { Effect } from "effect";

import type { ReactRouterContext, RouteArgs } from "./router-context";
import type { AppServices } from "./runtime";

type RouteServices = AppServices | ReactRouterContext;

/** A loader or action that runs `effect` with the app's services and its arguments. */
export const routeHandler =
  <A, E>(effect: Effect.Effect<A, E, RouteServices>) =>
  (args: RouteArgs): Promise<A> =>
    args.context.runtime.run(args, effect);

export const routeAction = routeHandler;
