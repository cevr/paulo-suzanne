import { describe, expect, it } from 'effect-bun-test';
import { Effect, Layer } from 'effect';

import { MANAGED_ASSETS, MENU_PDF_PUBLIC_HREF } from '~/lib/managed-assets';
import { Railway } from '~/services/Railway';
import { Storage, StorageError } from '~/services/Storage';

import { defaultContent } from './defaults';
import { imageUploadIntent, loadEditor, submitEditor } from './editor';
import { Content, normalizeSiteContentAssets } from './loader';
import type { SiteContent } from './schema';

function appendFormValue(form: FormData, path: string, value: unknown): void {
  if (Array.isArray(value)) {
    form.append('_array', path);
    value.forEach((item, index) =>
      appendFormValue(form, `${path}.${index}`, item),
    );
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      appendFormValue(form, path === '' ? key : `${path}.${key}`, child);
    }
    return;
  }
  form.append(path, String(value));
}

function contentForm(
  content: SiteContent,
  intent: 'save-draft' | 'publish',
): FormData {
  const form = new FormData();
  appendFormValue(form, '', content);
  form.set('intent', intent);
  return form;
}

const railwayTest = (deploy: () => string) =>
  Layer.succeed(
    Railway,
    Railway.of({
      enabled: Effect.succeed(true),
      triggerDeploy: Effect.sync(() => ({ deploymentId: deploy() })),
    }),
  );

const publishedContentObjects = {
  'content/site.json': {
    body: JSON.stringify(defaultContent),
  },
};

const storageWithListFailure = Layer.effect(
  Storage,
  Effect.gen(function* () {
    const storage = yield* Storage;
    return Storage.of({
      ...storage,
      list: () =>
        Effect.fail(
          new StorageError({
            key: '',
            op: 'list',
            message: 'catalog unavailable',
          }),
        ),
    });
  }),
).pipe(Layer.provide(Storage.layerTest(publishedContentObjects)));

describe('Content editor', () => {
  it.effect('projects storage objects into an editor-ready image catalog', () =>
    Effect.gen(function* () {
      const model = yield* loadEditor();

      expect(model.assetCatalogStatus).toBe('available');
      expect(model.assets).toEqual([
        {
          key: 'images/uploads/new-cover.webp',
          label: 'images/uploads/new-cover.webp',
        },
        { key: 'outdoor.avif', label: 'Outdoor photo' },
      ]);
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          Storage.layerTest({
            ...publishedContentObjects,
            'images/uploads/new-cover.webp': { body: 'image' },
            'images/uploads/new-cover.thumb.webp': { body: 'thumbnail' },
            'outdoor.avif': { body: 'image' },
            'menu.pdf': { body: 'document' },
            'notes.txt': { body: 'notes' },
          }),
          Content.layer,
          railwayTest(() => 'unused'),
        ),
      ),
    ),
  );

  it.effect(
    'returns managed image fallbacks when the catalog is unavailable',
    () =>
      Effect.gen(function* () {
        const model = yield* loadEditor();

        expect(model.assetCatalogStatus).toBe('fallback');
        expect(model.assets).toEqual(
          MANAGED_ASSETS.filter((asset) =>
            asset.accept.startsWith('image/'),
          ).map(({ key, label }) => ({ key, label })),
        );
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            storageWithListFailure,
            Content.layer,
            railwayTest(() => 'unused'),
          ),
        ),
      ),
  );

  it.effect(
    'normalizes locked asset references through the Content interface',
    () =>
      Effect.sync(() => {
        const content = normalizeSiteContentAssets({
          ...defaultContent,
          meta: {
            ...defaultContent.meta,
            ogImage: {
              ...defaultContent.meta.ogImage,
              key: 'images/uploads/new-cover.webp',
            },
          },
          menu: { ...defaultContent.menu, pdfHref: '/old-menu.pdf' },
        });

        expect(content.menu.pdfHref).toBe(MENU_PDF_PUBLIC_HREF);
        expect(content.jsonLd.menuPath).toBe(MENU_PDF_PUBLIC_HREF);
        expect(content.jsonLd.imageKey).toBe('images/uploads/new-cover.webp');
      }),
  );

  it.effect(
    'saves a private Draft without changing public Site content',
    () => {
      const draft: SiteContent = {
        ...defaultContent,
        hero: {
          ...defaultContent.hero,
          tagline: { ...defaultContent.hero.tagline, en: 'Draft tagline' },
        },
      };

      return Effect.gen(function* () {
        const result = yield* submitEditor(contentForm(draft, 'save-draft'));
        const storage = yield* Storage;
        const storedDraft = yield* storage.get('content/site.draft.json');
        const storedPublished = yield* Effect.exit(
          storage.get('content/site.json'),
        );
        const decodedDraft = yield* Effect.promise(
          () => new Response(storedDraft.stream).json() as Promise<SiteContent>,
        );

        expect(result).toMatchObject({
          _tag: 'Redirect',
          status: 'Draft saved.',
          published: false,
        });
        expect(decodedDraft.hero.tagline.en).toBe('Draft tagline');
        expect(storedPublished._tag).toBe('Failure');
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            Storage.layerTest(),
            railwayTest(() => 'unused'),
          ),
        ),
      );
    },
  );

  it.effect(
    'keeps unsaved edits when an Asset is uploaded and attached to the Draft',
    () =>
      Effect.gen(function* () {
        const edited: SiteContent = {
          ...defaultContent,
          hero: {
            ...defaultContent.hero,
            tagline: { ...defaultContent.hero.tagline, en: 'Keep this edit' },
          },
        };
        const form = contentForm(edited, 'save-draft');
        form.set('intent', imageUploadIntent('meta.ogImage'));
        const source = Bun.file('public/images/logo-small.png');
        const buffer = yield* Effect.promise(() => source.arrayBuffer());
        form.set(
          'meta.ogImage.__file',
          new File([buffer], 'Fresh Cover.PNG', { type: 'image/png' }),
        );

        const result = yield* submitEditor(form);
        const storage = yield* Storage;
        const stored = yield* storage.get('content/site.draft.json');
        const draft = yield* Effect.promise(
          () => new Response(stored.stream).json() as Promise<SiteContent>,
        );

        expect(result).toMatchObject({
          _tag: 'Redirect',
          status: 'Image uploaded and Draft saved.',
        });
        expect(draft.hero.tagline.en).toBe('Keep this edit');
        expect(draft.meta.ogImage.key).toMatch(
          /^images\/uploads\/fresh-cover-.*\.webp$/,
        );
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            Storage.layerTest(),
            railwayTest(() => 'unused'),
          ),
        ),
      ),
  );

  it.effect(
    'publishes changed Site content once and treats a repeat as up to date',
    () => {
      let deployments = 0;
      const published: SiteContent = {
        ...defaultContent,
        hero: {
          ...defaultContent.hero,
          tagline: { ...defaultContent.hero.tagline, en: 'Now live' },
        },
      };

      return Effect.gen(function* () {
        const first = yield* submitEditor(contentForm(published, 'publish'));
        const second = yield* submitEditor(contentForm(published, 'publish'));
        const storage = yield* Storage;
        const stored = yield* storage.get('content/site.json');
        const decoded = yield* Effect.promise(
          () => new Response(stored.stream).json() as Promise<SiteContent>,
        );

        expect(first).toMatchObject({ _tag: 'Redirect', published: true });
        expect(second).toMatchObject({
          _tag: 'Redirect',
          status:
            'No changes to publish. The live website is already up to date.',
          published: true,
        });
        expect(deployments).toBe(1);
        expect(decoded.hero.tagline.en).toBe('Now live');
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            Storage.layerTest(),
            railwayTest(() => {
              deployments += 1;
              return `deployment-${deployments}`;
            }),
          ),
        ),
      );
    },
  );

  it.effect(
    'returns section-local validation errors for an incomplete Draft',
    () =>
      Effect.gen(function* () {
        const form = contentForm(defaultContent, 'save-draft');
        form.set('hero.tagline.en', '');

        const result = yield* submitEditor(form);

        expect(result._tag).toBe('Rejected');
        if (result._tag === 'Rejected') {
          expect(result.status).toBe(400);
          expect(result.fieldErrors.hero?.length).toBeGreaterThan(0);
        }
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            Storage.layerTest(),
            railwayTest(() => 'unused'),
          ),
        ),
      ),
  );

  it.effect(
    'assigns menu document errors to the Menu PDF editorial section',
    () =>
      Effect.gen(function* () {
        const form = contentForm(defaultContent, 'save-draft');
        form.set('menu.pdfHeading.en', '');

        const result = yield* submitEditor(form);

        expect(result._tag).toBe('Rejected');
        if (result._tag === 'Rejected') {
          expect(result.fieldErrors.menuPdf?.length).toBeGreaterThan(0);
          expect(result.fieldErrors.menu).toBeUndefined();
        }
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            Storage.layerTest(),
            railwayTest(() => 'unused'),
          ),
        ),
      ),
  );
});
