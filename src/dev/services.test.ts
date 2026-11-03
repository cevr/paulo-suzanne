import { BunServices } from "@effect/platform-bun";
import { describe, expect, it } from "effect-bun-test";
import { ConfigProvider, Effect, FileSystem, Layer, Schema } from "effect";

import { defaultContent } from "~/content/defaults";
import { loadAdminContent, loadContent } from "~/content/loader";
import { SiteContent } from "~/content/schema";
import { Storage } from "~/services/Storage";

import { DevServices } from "./services";

const SITE_JSON = "content/site.json";

const encodeSiteJson = Schema.encodeEffect(Schema.fromJsonString(SiteContent));

const DevConfig = ConfigProvider.layer(
  ConfigProvider.fromUnknown({ COOKIE_SECRET: "a".repeat(64) }),
);

const SeededDevServices = Layer.unwrap(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const bucketRoot = yield* fs.makeTempDirectoryScoped({ prefix: "dev-bucket-" });
    yield* fs.makeDirectory(`${bucketRoot}/content`, { recursive: true });
    yield* fs.writeFileString(`${bucketRoot}/${SITE_JSON}`, yield* encodeSiteJson(defaultContent));
    return DevServices(bucketRoot);
  }),
).pipe(Layer.provide(Layer.merge(BunServices.layer, DevConfig)));

describe("DevServices", () => {
  it.effect.layer(SeededDevServices)("loads the published content from the bucket folder", () =>
    Effect.gen(function* () {
      expect(yield* loadContent).toEqual(defaultContent);

      const admin = yield* loadAdminContent;
      expect(admin.source).toBe("published");

      const storage = yield* Storage;
      const head = yield* storage.head(SITE_JSON);
      expect(head?.contentType).toBe("application/json");
    }),
  );
});
