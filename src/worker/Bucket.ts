import * as Alchemy from "alchemy";
import * as Cloudflare from "@alchemy.run/cloudflare";
import { Stage } from "alchemy/Stage";
import { Effect, Option } from "effect";

const isProd = Effect.serviceOption(Stage).pipe(Effect.map(Option.contains("prod")));

export const Bucket = Cloudflare.R2.Bucket("Bucket", { forceDestroy: true }).pipe(
  Alchemy.RemovalPolicy.retain(isProd),
);
