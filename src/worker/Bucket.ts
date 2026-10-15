/**
 * The site's R2 bucket: published and draft content, the menu PDF and photos.
 *
 * In `prod` it is retained, so destroying the stack never deletes the site's
 * content. Any other stage empties and deletes its own bucket on destroy.
 */
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Stage } from "alchemy/Stage";
import { Effect, Option } from "effect";

const isProd = Effect.serviceOption(Stage).pipe(Effect.map(Option.contains("prod")));

export const Bucket = Cloudflare.R2.Bucket("Bucket", { forceDestroy: true }).pipe(
  Alchemy.RemovalPolicy.retain(isProd),
);
