import { describe, expect, it } from 'effect-bun-test';
import { DateTime, Effect } from 'effect';

import { Storage } from './Storage';

const date = (iso: string): Date => DateTime.toDateUtc(DateTime.makeUnsafe(iso));

describe('Storage', () => {
  it.effect('layerTest lists stored objects by prefix', () =>
    Effect.gen(function* () {
      const storage = yield* Storage;

      const objects = yield* storage.list('images/');

      expect(objects).toEqual([
        {
          key: 'images/a.avif',
          size: 1,
          lastModified: date('2026-05-06T10:00:00.000Z'),
        },
        {
          key: 'images/b.avif',
          size: 2,
          lastModified: date('2026-05-06T11:00:00.000Z'),
        },
      ]);
    }).pipe(
      Effect.provide(
        Storage.layerTest({
          'content/site.json': {
            body: '{}',
            lastModified: date('2026-05-06T09:00:00.000Z'),
          },
          'images/a.avif': {
            body: 'a',
            lastModified: date('2026-05-06T10:00:00.000Z'),
          },
          'images/b.avif': {
            body: 'bb',
            lastModified: date('2026-05-06T11:00:00.000Z'),
          },
        }),
      ),
    ),
  );
});
