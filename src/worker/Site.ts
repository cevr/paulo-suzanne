/**
 * pauloetsuzanne.com on Cloudflare: one Worker with the client build as its
 * static assets, an R2 bucket for content and photos, the Images binding for
 * admin uploads, and Workers Cache in front.
 *
 * Requests are served assets-first: a hashed file or a public file never
 * invokes the Worker. Everything else reaches `fetch`, which serves a bucket
 * file or a React Router page (`../server/render.ts`).
 *
 * `prod` takes the Worker name `paulo-suzanne`. Until the cutover it answers
 * only on its `workers.dev` host; `PROD_HOSTS = "domains"` adds zone routes
 * for the three domains, which take over their proxied traffic from Railway
 * on deploy with no DNS change. Any other stage is a throwaway copy on a
 * generated `workers.dev` name.
 */
import type { RuntimeContext } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
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

/** Where `prod` answers: its workers.dev host before the cutover, the domains after. */
const PROD_HOSTS: "workers-dev" | "domains" = "workers-dev";

const ASSETS = {
  directory: "build/client",
  htmlHandling: "drop-trailing-slash",
  notFoundHandling: "none",
} as const;

const routes = Arr.flatMap(DOMAINS, (zoneName) => [
  { pattern: `${zoneName}/*`, zoneName },
  { pattern: `www.${zoneName}/*`, zoneName },
]);

/** The props, by stage. The running Worker reads them without one. */
const props = Effect.gen(function* () {
  const stage = yield* Effect.serviceOption(Stage);
  const base = { main: import.meta.url, assets: ASSETS };
  if (!Option.contains(stage, "prod")) return base;
  if (PROD_HOSTS === "workers-dev") return { ...base, name: "paulo-suzanne" };
  return { ...base, name: "paulo-suzanne", routes };
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
