import { Context, Effect, Layer, Schema } from "effect";

export const SITE_CACHE_TAG = "site";

export class SiteCachePurgeError extends Schema.TaggedError<
  SiteCachePurgeError,
  { readonly brand: unique symbol }
>()("paulo-suzanne/services/SiteCache/SiteCachePurgeError", { message: Schema.String }) {}

export class SiteCache extends Context.Service<
  SiteCache,
  {
    readonly purge: Effect.Effect<void, SiteCachePurgeError>;
  }
>()("paulo-suzanne/services/SiteCache") {
  static layerNone = Layer.succeed(SiteCache, SiteCache.of({ purge: Effect.void }));
}
