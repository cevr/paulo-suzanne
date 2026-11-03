import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";
import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";

import {
  createDevVite,
  looksLikeViteAsset,
  runViteMiddleware,
  SERVER_BUILD_ID,
} from "./app/lib/dev/vite-middleware.ts";
import {
  makeRequestRuntime,
  type AppServices,
  type RequestRuntime,
} from "./app/lib/effect/runtime.ts";
import { Storage } from "./app/services/Storage.ts";
import { DevServices } from "./src/dev/services.ts";

const PORT = Number(Bun.env["PORT"]) || 3000;

const AppLayer = DevServices(".data/bucket");
const vite = await createDevVite();

class Unhandled extends Schema.TaggedError<Unhandled, { readonly brand: unique symbol }>()(
  "paulo-suzanne/server/Unhandled",
  {},
) {}

const bucketFile = Effect.fn("bucketFile")(function* (pathname: string) {
  if (!/\.[A-Za-z0-9]+$/.test(pathname) || pathname.endsWith(".data")) {
    return yield* Unhandled.make();
  }
  const storage = yield* Storage;
  const object = yield* storage
    .get(decodeURIComponent(pathname.slice(1)))
    .pipe(Effect.catchTag("paulo-suzanne/services/Storage/NotFound", () => Unhandled.make()));
  return HttpServerResponse.raw(object.stream, {
    headers: { "content-type": object.contentType, "content-length": String(object.size) },
  });
});

const viteAsset = Effect.fn("viteAsset")(function* (request: Request) {
  const { pathname } = new URL(request.url);
  if (request.method !== "GET" || !looksLikeViteAsset(pathname)) return yield* Unhandled.make();
  const response = yield* Effect.promise(() => runViteMiddleware(vite, request));
  if (response === null) return yield* Unhandled.make();
  return HttpServerResponse.fromWeb(response);
});

const reactRouter = Effect.fn("reactRouter")(function* (runtime: RequestRuntime, request: Request) {
  const build = yield* Effect.promise(
    () => vite.ssrLoadModule(SERVER_BUILD_ID) as Promise<ServerBuild>,
  );
  const context = new RouterContextProvider();
  context.runtime = runtime;
  const response = yield* Effect.promise(() =>
    createRequestHandler(build, "development")(request, context),
  );
  return HttpServerResponse.fromWeb(response);
});

const Routes = Layer.unwrap(
  Effect.gen(function* () {
    const services = yield* Effect.context<AppServices>();
    const runtime = makeRequestRuntime(Effect.runPromiseExitWith(services));
    return HttpRouter.add("*", "*", (request) =>
      Effect.gen(function* () {
        const web = yield* HttpServerRequest.toWeb(request);
        const { pathname } = new URL(web.url);
        return yield* bucketFile(pathname).pipe(
          Effect.catchTag("paulo-suzanne/server/Unhandled", () => viteAsset(web)),
          Effect.catchTag("paulo-suzanne/server/Unhandled", () => reactRouter(runtime, web)),
        );
      }).pipe(Effect.provideContext(services)),
    );
  }),
).pipe(Layer.provide(AppLayer));

const ServerLive = HttpRouter.serve(Routes).pipe(
  Layer.provide(BunHttpServer.layer({ port: PORT })),
);

BunRuntime.runMain(Layer.launch(ServerLive));
