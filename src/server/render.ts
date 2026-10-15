/**
 * A request the static files do not answer: a bucket file, or a page
 * rendered by React Router.
 *
 * A path with a file extension is looked up in the bucket first (photos, the
 * menu PDF, uploads). A miss, and every other path, goes to React Router with
 * a request runtime made from the services the Worker built for this request.
 *
 * Public responses are cached at the edge under the site's cache tag, which
 * a publish or a menu upload purges. The admin, and any response that sets a
 * cookie, is never cached.
 */
import { Effect, Option, type Context } from "effect";
import { Headers, HttpServerRequest, HttpServerResponse } from "effect/http";
import { RouterContextProvider } from "react-router";

import { makeRequestRuntime, type AppServices } from "~/lib/effect/runtime";
import { SITE_CACHE_TAG } from "~/services/SiteCache";
import { Storage, type NotFound, type StorageError } from "~/services/Storage";

/** React Router's request handler, as `createRequestHandler` returns it. */
export type Handle = (request: Request, context: RouterContextProvider) => Promise<Response>;

export const CACHE = {
  page: "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
  file: "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400",
  private: "private, no-store, max-age=0",
} as const;

const isPrivate = (pathname: string, headers: Headers.Headers): boolean =>
  pathname === "/admin" ||
  pathname.startsWith("/admin/") ||
  pathname.startsWith("/admin.") ||
  Headers.has(headers, "set-cookie");

/** The response with its edge policy: private, cached under the site tag, or as it set. */
export const withPolicy = (pathname: string, response: HttpServerResponse.HttpServerResponse) => {
  if (isPrivate(pathname, response.headers)) {
    return HttpServerResponse.setHeader(response, "cache-control", CACHE.private);
  }
  if (response.status !== 200 || Headers.has(response.headers, "cache-control")) return response;
  return HttpServerResponse.setHeaders(response, {
    "cache-control": CACHE.page,
    "cache-tag": SITE_CACHE_TAG,
  });
};

const decodePath = Option.liftThrowable(decodeURIComponent);

/** The bucket key a path names, when it names a file and not React Router data. */
export const bucketKey = (pathname: string): Option.Option<string> => {
  if (!/\.[A-Za-z0-9]+$/.test(pathname) || pathname.endsWith(".data")) return Option.none();
  return decodePath(pathname.slice(1)).pipe(Option.filter((key) => !key.split("/").includes("..")));
};

const readsFile = (method: string, pathname: string): Option.Option<string> =>
  Option.filter(bucketKey(pathname), () => method === "GET" || method === "HEAD");

const bucketFile = Effect.fn("Site.bucketFile")(function* (key: string) {
  const storage = yield* Storage;
  const object = yield* storage.get(key);
  return HttpServerResponse.raw(object.stream, {
    headers: {
      "content-type": object.contentType,
      "content-length": String(object.size),
      "cache-control": CACHE.file,
      "cache-tag": SITE_CACHE_TAG,
    },
  });
});

const page = Effect.fn("Site.page")(function* (
  handle: Handle,
  web: Request,
  services: Context.Context<AppServices>,
) {
  const context = new RouterContextProvider();
  context.runtime = makeRequestRuntime((effect) =>
    Effect.runPromiseExit(Effect.provideContext(effect, services)),
  );
  // React Router answers every request it is handed, errors included, so a
  // rejected promise is a defect, not an expected failure.
  const response = yield* Effect.promise(() => handle(web, context));
  return HttpServerResponse.fromWeb(response);
});

export const render = Effect.fn("Site.render")(function* (
  handle: Handle,
  request: HttpServerRequest.HttpServerRequest,
  services: Context.Context<AppServices>,
) {
  const web = yield* HttpServerRequest.toWeb(request);
  const { pathname } = new URL(web.url);
  const source: Effect.Effect<
    HttpServerResponse.HttpServerResponse,
    NotFound | StorageError,
    Storage
  > = Option.match(readsFile(request.method, pathname), {
    onNone: () => page(handle, web, services),
    onSome: bucketFile,
  });
  const response = yield* source.pipe(
    Effect.catchTags({
      "paulo-suzanne/services/Storage/NotFound": () => page(handle, web, services),
      "paulo-suzanne/services/Storage/StorageError": (error) =>
        Effect.logError("bucket read failed", error).pipe(
          Effect.as(HttpServerResponse.empty({ status: 502 })),
        ),
    }),
    Effect.provideContext(services),
  );
  return withPolicy(pathname, response);
});

/** `render`, with a request the host cannot hand to React Router answered 400. */
export const respond = (
  handle: Handle,
  request: HttpServerRequest.HttpServerRequest,
  services: Context.Context<AppServices>,
) =>
  render(handle, request, services).pipe(
    Effect.catchTag(["RequestParseError", "RouteNotFound", "InternalError"], () =>
      Effect.succeed(HttpServerResponse.empty({ status: 400 })),
    ),
  );
