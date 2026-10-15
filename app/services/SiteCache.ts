/**
 * The edge cache in front of the public site.
 *
 * Public pages and bucket files are cached at the edge under one tag, so a
 * publish or a new menu PDF must purge it before visitors see the change.
 * The deployed Worker provides the Workers Cache purge; the dev server and
 * tests have no edge cache, so `layerNone` succeeds at once.
 */
import { Context, Effect, Layer, Schema } from "effect";

/** The `Cache-Tag` on every cacheable public response. */
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
