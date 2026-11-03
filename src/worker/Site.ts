import type { RuntimeContext } from "alchemy";
import * as Cloudflare from "@alchemy.run/cloudflare";
import { Stage } from "alchemy/Stage";
import { Array as Arr, Context, Effect, Layer, Option } from "effect";
import { HttpServerRequest } from "effect/http";
import { createRequestHandler } from "react-router";

import * as build from "#server-build";

import { Content } from "~/content/loader";
import { Auth } from "~/services/Auth";
import { ImageProcessor } from "~/services/ImageProcessor";
import { SiteCache } from "~/services/SiteCache";
import { Storage } from "~/services/Storage";

import { respond } from "../server/render.ts";
import { imagesFromBinding, siteCacheFromWorkersCache, storageFromR2 } from "./adapters.ts";
import { Bucket } from "./Bucket.ts";

export const DOMAINS = ["pauloetsuzanne.com", "pauloetsuzanne.ca", "pauloetsuzanne.net"] as const;

const PROD_HOSTS: keyof typeof HOSTS = "domains";

const ASSETS = {
  directory: "build/client",
  htmlHandling: "drop-trailing-slash",
  notFoundHandling: "none",
} as const;

const routes = Arr.flatMap(DOMAINS, (zoneName) => [
  { pattern: `${zoneName}/*`, zoneName },
  { pattern: `www.${zoneName}/*`, zoneName },
]);

const HOSTS = {
  "workers-dev": {},
  domains: { routes },
};

const props = Effect.gen(function* () {
  const stage = yield* Effect.serviceOption(Stage);
  const base = { main: import.meta.url, assets: ASSETS };
  if (!Option.contains(stage, "prod")) return base;
  return { ...base, name: "paulo-suzanne", ...HOSTS[PROD_HOSTS] };
});

export default class Site extends Cloudflare.Worker<Site>()(
  "Site",
  props,
  Effect.gen(function* () {
    const bucket = yield* Cloudflare.R2.ReadWriteBucket(Bucket);
    const images = yield* Cloudflare.Images.Images();
    const cache = yield* Cloudflare.cache();
    const auth = Auth.make(yield* Auth.secrets);
    const handle = createRequestHandler(build, "production");

    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const runtime = yield* Effect.context<RuntimeContext>();
        const storage = storageFromR2(bucket, runtime);
        const services = Context.make(Storage, storage).pipe(
          Context.add(Auth, auth),
          Context.add(Content, Content.make(storage)),
          Context.add(SiteCache, siteCacheFromWorkersCache(cache, runtime)),
          Context.add(ImageProcessor, imagesFromBinding(images, runtime)),
        );
        return yield* respond(handle, request, services);
      }),
    };
  }).pipe(
    Effect.provide(
      Layer.mergeAll(Cloudflare.R2.ReadWriteBucketBinding, Cloudflare.Images.ImagesBinding),
    ),
  ),
) {}
