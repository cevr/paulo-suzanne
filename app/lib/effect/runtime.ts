import { Cause, Effect, Exit, Schema } from "effect";
import { redirect } from "react-router";

import type { Content, ContentLoadError } from "~/content/loader";
import type { ImageProcessor } from "~/services/ImageProcessor";
import { Unauthorized, type Auth } from "~/services/Auth";
import type { SiteCache } from "~/services/SiteCache";
import { NotFound, StorageError, type Storage } from "~/services/Storage";

import { ReactRouterContext, type RouteArgs } from "./router-context";

export type AppServices = Storage | Auth | Content | SiteCache | ImageProcessor;
export type AppError = Response | Unauthorized | NotFound | StorageError | ContentLoadError;

export type RunExit = <A, E>(effect: Effect.Effect<A, E, AppServices>) => Promise<Exit.Exit<A, E>>;

export type RequestRuntime = {
  readonly run: <A, E>(
    args: RouteArgs,
    effect: Effect.Effect<A, E, AppServices | ReactRouterContext>,
  ) => Promise<A>;
};

declare module "react-router" {
  interface RouterContextProvider {
    runtime: RequestRuntime;
  }
}

const isResponse = (v: unknown): v is Response =>
  typeof v === "object" && v !== null && v instanceof Response;

const reportServerError = (cause: Cause.Cause<unknown>): void => {
  console.error(`[paulo-suzanne] Effect error: ${Cause.pretty(cause)}`);
};

const throwHttpError = (error: unknown): never => {
  if (isResponse(error)) throw error;

  if (Schema.is(Unauthorized)(error)) {
    throw redirect("/admin/login");
  }
  if (Schema.is(NotFound)(error)) {
    throw new Response("Not Found", { status: 404 });
  }
  if (Schema.is(StorageError)(error)) {
    reportServerError(Cause.fail(error));
    throw new Response(JSON.stringify({ message: "Storage error", op: error.op }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  reportServerError(Cause.die(error));
  throw new Response("Internal Server Error", { status: 500 });
};

const throwCauseError = (cause: Cause.Cause<unknown>): never => {
  for (const reason of cause.reasons) {
    if (Cause.isFailReason(reason)) throwHttpError(reason.error);
    if (Cause.isDieReason(reason) && isResponse(reason.defect)) throw reason.defect;
  }

  reportServerError(cause);
  throw new Response("Internal Server Error", { status: 500 });
};

export const makeRequestRuntime = (runExit: RunExit): RequestRuntime => ({
  run: (args, effect) =>
    runExit(effect.pipe(Effect.provideService(ReactRouterContext, args))).then((exit) =>
      Exit.isSuccess(exit) ? exit.value : throwCauseError(exit.cause),
    ),
});
