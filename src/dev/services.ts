import { BunServices } from "@effect/platform-bun";
import { Layer, type Config } from "effect";

import { Content } from "~/content/loader";
import type { AppServices } from "~/lib/effect/runtime";
import { Auth } from "~/services/Auth";
import { ImageProcessor } from "~/services/ImageProcessor";
import { SiteCache } from "~/services/SiteCache";
import { Storage } from "~/services/Storage";

export const DevServices = (bucketRoot: string): Layer.Layer<AppServices, Config.ConfigError> => {
  const FolderStorage = Storage.layerDirectory(bucketRoot).pipe(Layer.provide(BunServices.layer));
  return Layer.mergeAll(
    FolderStorage,
    Content.layer.pipe(Layer.provide(FolderStorage)),
    Auth.layer,
    SiteCache.layerNone,
    ImageProcessor.layerBun,
  );
};
