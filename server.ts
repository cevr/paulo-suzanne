import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import { Data, Effect, Layer } from 'effect';
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from 'effect/unstable/http';
import { createRequestHandler, RouterContextProvider } from 'react-router';
import type { ServerBuild } from 'react-router';

import { makeRequestRuntime, type RequestRuntime } from './app/lib/effect/runtime.ts';
import { Auth } from './app/services/Auth.ts';
import { Storage } from './app/services/Storage.ts';

declare module 'react-router' {
  interface RouterContextProvider {
    runtime: RequestRuntime;
  }
}

const isDev = process.env.NODE_ENV !== 'production';
const PORT = Number(process.env.PORT) || 3000;
const BUILD_PATH = './build/server/index.js';
const CLIENT_PATH = './build/client';

const dev = isDev ? await import('./app/lib/dev/vite-middleware.ts') : null;
const vite = dev !== null ? await dev.createDevVite() : null;

const loadBuild = (): Promise<ServerBuild> =>
  vite !== null && dev !== null ?
    (vite.ssrLoadModule(dev.SERVER_BUILD_ID) as Promise<ServerBuild>)
  : (import(BUILD_PATH) as Promise<ServerBuild>);

const PRERENDERED: Record<string, string> = {
  '/': `${CLIENT_PATH}/index.html`,
  '/en': `${CLIENT_PATH}/en/index.html`,
};

const BUCKETED_EXACT = [
  '/menu.pdf',
  '/indoor.avif',
  '/outdoor.avif',
  '/retro-diner-red-booths.avif',
] as const;

class FileMissing extends Data.TaggedError('FileMissing')<{ readonly path: string }> {}
class ViteUnhandled extends Data.TaggedError('ViteUnhandled')<{}> {}

const mimeFor = (pathname: string): string => {
  if (pathname.endsWith('.js')) return 'application/javascript';
  if (pathname.endsWith('.css')) return 'text/css';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.avif')) return 'image/avif';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.woff2')) return 'font/woff2';
  if (pathname.endsWith('.json')) return 'application/json';
  if (pathname.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
};

const fileResponse = Effect.fn('fileResponse')(function* (
  filePath: string,
  contentType: string,
  cacheControl: string,
) {
  const file = Bun.file(filePath);
  const exists = yield* Effect.promise(() => file.exists());
  if (!exists) return yield* Effect.fail(new FileMissing({ path: filePath }));
  const buf = yield* Effect.promise(() => file.arrayBuffer());
  return HttpServerResponse.uint8Array(new Uint8Array(buf), {
    contentType,
    headers: { 'cache-control': cacheControl },
  });
});

const bucketResponse = Effect.fn('bucketResponse')(function* (key: string) {
  const storage = yield* Storage;
  const obj = yield* storage.get(key);
  return HttpServerResponse.raw(obj.stream, {
    status: 200,
    headers: {
      'content-type': obj.contentType,
      'content-length': String(obj.size),
      'cache-control': 'public, max-age=300',
    },
  });
});

const bucketAsset = (pathname: string) =>
  bucketResponse(pathname.replace(/^\//, '')).pipe(
    Effect.catchTag('@paulo-suzanne/services/Storage/NotFound', () =>
      Effect.succeed(HttpServerResponse.empty({ status: 404 })),
    ),
    Effect.catchTag('@paulo-suzanne/services/Storage/StorageError', (e) =>
      Effect.logError('storage error', e).pipe(
        Effect.as(HttpServerResponse.empty({ status: 502 })),
      ),
    ),
  );

const reactRouterFallback = Effect.fn('reactRouterFallback')(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const webRequest = yield* HttpServerRequest.toWeb(request);
  const build = yield* Effect.promise(() => loadBuild());
  const handler = createRequestHandler(build, isDev ? 'development' : 'production');
  const context = new RouterContextProvider();
  context.runtime = makeRequestRuntime();
  const webResponse = yield* Effect.promise(() => handler(webRequest, context));
  return HttpServerResponse.raw(webResponse.body, {
    status: webResponse.status,
    statusText: webResponse.statusText,
    headers: Object.fromEntries(webResponse.headers.entries()),
  });
});

const viteAssetResponse = Effect.fn('viteAsset')(function* () {
  if (vite === null || dev === null) return yield* Effect.fail(new ViteUnhandled());
  const request = yield* HttpServerRequest.HttpServerRequest;
  const webRequest = yield* HttpServerRequest.toWeb(request);
  const url = new URL(webRequest.url);
  if (url.pathname.startsWith('/.well-known/')) {
    return HttpServerResponse.empty({ status: 404 });
  }
  if (request.method !== 'GET' || !dev.looksLikeViteAsset(url.pathname)) {
    return yield* Effect.fail(new ViteUnhandled());
  }
  const result = yield* Effect.promise(() => dev.runViteMiddleware(vite, webRequest));
  if (result === null) return yield* Effect.fail(new ViteUnhandled());
  return HttpServerResponse.raw(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers: Object.fromEntries(result.headers.entries()),
  });
});

const stripQuery = (url: string): string => {
  const q = url.indexOf('?');
  return q === -1 ? url : url.slice(0, q);
};

const HashedAssetsRoute = HttpRouter.add('GET', '/assets/*', (request) => {
  const path = stripQuery(request.url);
  return fileResponse(
    `${CLIENT_PATH}${path}`,
    mimeFor(path),
    'public, max-age=31536000, immutable',
  ).pipe(
    Effect.catchTag('FileMissing', () =>
      Effect.succeed(HttpServerResponse.empty({ status: 404 })),
    ),
  );
});

const FoodImagesRoute = HttpRouter.add('GET', '/images/food/*', (request) =>
  bucketAsset(stripQuery(request.url)),
);

const [BucketedFirst, ...BucketedRest] = BUCKETED_EXACT.map((p) =>
  HttpRouter.add('GET', p, bucketAsset(p)),
);
const BucketedExactRoutes = Layer.mergeAll(BucketedFirst!, ...BucketedRest);

const PrerenderedRoutes = Layer.mergeAll(
  HttpRouter.add('GET', '/', () =>
    fileResponse(PRERENDERED['/']!, 'text/html; charset=utf-8', 'public, max-age=3600').pipe(
      Effect.catchTag('FileMissing', () => reactRouterFallback()),
    ),
  ),
  HttpRouter.add('GET', '/en', () =>
    fileResponse(PRERENDERED['/en']!, 'text/html; charset=utf-8', 'public, max-age=3600').pipe(
      Effect.catchTag('FileMissing', () => reactRouterFallback()),
    ),
  ),
);

const FallbackRoute = HttpRouter.add('*', '*', () =>
  isDev ?
    viteAssetResponse().pipe(Effect.catchTag('ViteUnhandled', () => reactRouterFallback()))
  : reactRouterFallback(),
);

const ProdRoutes = Layer.mergeAll(
  HashedAssetsRoute,
  FoodImagesRoute,
  BucketedExactRoutes,
  PrerenderedRoutes,
  FallbackRoute,
);

const DevRoutes = Layer.mergeAll(
  FoodImagesRoute,
  BucketedExactRoutes,
  FallbackRoute,
);

const RoutesLive = isDev ? DevRoutes : ProdRoutes;

const ServerLive = HttpRouter.serve(RoutesLive).pipe(
  Layer.provide(Storage.layer),
  Layer.provide(Auth.layer),
  Layer.provide(BunHttpServer.layer({ port: PORT })),
);

BunRuntime.runMain(Layer.launch(ServerLive));
