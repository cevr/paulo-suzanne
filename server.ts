/**
 * The local dev server: Vite with hot reload, React Router, and the app's
 * services from local layers. Production is the Worker (`src/worker/Site.ts`).
 *
 * The bucket is the `.data/bucket` directory. Start with an empty one and
 * `ALLOW_DEFAULT_CONTENT=1` to see the bundled defaults, or copy objects in.
 * `ADMIN_PASSWORD` and `COOKIE_SECRET` come from `.env`.
 */
import { BunHttpServer, BunRuntime, BunServices } from "@effect/platform-bun";
import { Data, Effect, Layer } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";
import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";

import { Content } from "./app/content/loader.ts";
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
import { Auth } from "./app/services/Auth.ts";
import { ImageProcessor } from "./app/services/ImageProcessor.ts";
import { SiteCache } from "./app/services/SiteCache.ts";
import { Storage } from "./app/services/Storage.ts";

const PORT = Number(Bun.env["PORT"]) || 3000;

const AppLayer = Layer.mergeAll(
  Storage.layerDirectory(".data/bucket"),
  Auth.layer,
  Content.layer,
  SiteCache.layerNone,
  ImageProcessor.layerBun,
).pipe(Layer.provide(BunServices.layer));
const vite = await createDevVite();

class Unhandled extends Data.TaggedError("paulo-suzanne/server/Unhandled")<{}> {}

const bucketFile = Effect.fn("bucketFile")(function* (pathname: string) {
  if (!/\.[A-Za-z0-9]+$/.test(pathname) || pathname.endsWith(".data")) {
    return yield* new Unhandled();
  }
  const storage = yield* Storage;
  const object = yield* storage
    .get(decodeURIComponent(pathname.slice(1)))
    .pipe(Effect.catchTag("paulo-suzanne/services/Storage/NotFound", () => new Unhandled()));
  return HttpServerResponse.raw(object.stream, {
    headers: { "content-type": object.contentType, "content-length": String(object.size) },
  });
});

const viteAsset = Effect.fn("viteAsset")(function* (request: Request) {
  const { pathname } = new URL(request.url);
  if (request.method !== "GET" || !looksLikeViteAsset(pathname)) return yield* new Unhandled();
  const response = yield* Effect.promise(() => runViteMiddleware(vite, request));
  if (response === null) return yield* new Unhandled();
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

// The app's services are built once; every request runs against them.
const Routes = Layer.unwrap(
  Effect.gen(function* () {
    const services = yield* Effect.context<AppServices>();
    const runtime = makeRequestRuntime((effect) =>
      Effect.runPromiseExit(Effect.provideContext(effect, services)),
    );
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
