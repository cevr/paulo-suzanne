import * as Alchemy from "alchemy";
import * as Cloudflare from "@alchemy.run/cloudflare";
import { Effect } from "effect";

import { Bucket } from "./src/worker/Bucket.ts";
import Site from "./src/worker/Site.ts";

export const providers = Cloudflare.providers();

export default Alchemy.Stack(
  "paulo-suzanne",
  { providers, state: Cloudflare.state() },
  Effect.gen(function* () {
    const bucket = yield* Bucket;
    const site = yield* Site;
    return { url: site.url, bucket: bucket.bucketName };
  }),
);
