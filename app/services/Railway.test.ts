import { describe, expect, it } from 'effect-bun-test';
import { ConfigProvider, Effect, Layer } from 'effect';
import { FetchHttpClient } from 'effect/unstable/http';

import { Railway, RailwayDisabled } from './Railway.ts';

const EmptyConfig = ConfigProvider.layer(ConfigProvider.fromUnknown({}));
const PartialConfig = ConfigProvider.layer(
  ConfigProvider.fromUnknown({
    RAILWAY_API_TOKEN: 'tkn',
    RAILWAY_SERVICE_ID: 'svc',
    // missing RAILWAY_ENVIRONMENT_ID
  }),
);
const FullConfig = ConfigProvider.layer(
  ConfigProvider.fromUnknown({
    RAILWAY_API_TOKEN: 'tkn',
    RAILWAY_SERVICE_ID: 'svc',
    RAILWAY_ENVIRONMENT_ID: 'env',
  }),
);

const layerWithConfig = (config: Layer.Layer<never>) =>
  Railway.layer.pipe(Layer.provideMerge(Layer.mergeAll(config, FetchHttpClient.layer)));

describe('Railway', () => {
  it.effect('reports disabled when no env is set', () =>
    Effect.gen(function* () {
      const railway = yield* Railway;
      expect(yield* railway.enabled).toBe(false);
    }).pipe(Effect.provide(layerWithConfig(EmptyConfig))),
  );

  it.effect('reports disabled when env is partial', () =>
    Effect.gen(function* () {
      const railway = yield* Railway;
      expect(yield* railway.enabled).toBe(false);
    }).pipe(Effect.provide(layerWithConfig(PartialConfig))),
  );

  it.effect('reports enabled when all three vars are set', () =>
    Effect.gen(function* () {
      const railway = yield* Railway;
      expect(yield* railway.enabled).toBe(true);
    }).pipe(Effect.provide(layerWithConfig(FullConfig))),
  );

  it.effect('triggerDeploy fails with RailwayDisabled when env is incomplete', () =>
    Effect.gen(function* () {
      const railway = yield* Railway;
      const result = yield* Effect.flip(railway.triggerDeploy);
      expect(result).toBeInstanceOf(RailwayDisabled);
    }).pipe(Effect.provide(layerWithConfig(PartialConfig))),
  );
});
