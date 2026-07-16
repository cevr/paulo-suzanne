import { DateTime, Effect } from 'effect';
import { useEffect, useRef } from 'react';
import { Form, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  EDITOR_SECTION_KEYS,
  loadEditor,
  submitEditor,
  type EditorFieldErrors,
  type EditorMutation,
  type EditorSectionKey,
} from '~/content/editor';
import { SiteContent } from '~/content/schema';
import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { Auth } from '~/services/Auth';

import {
  assetOptionsFromKeys,
  fallbackImageAssets,
  type AssetOption,
} from './_components/asset-picker';
import {
  AboutSection,
  ContactSection,
  FooterSection,
  HeaderSection,
  HeroSection,
  JsonLdSection,
  LocationSection,
  MENU_PDF_UPLOAD_FORM_ID,
  MenuPdfSection,
  MenuSection,
  MetaSection,
} from './_components/sections';

const SECTIONS = EDITOR_SECTION_KEYS;
type SectionKey = EditorSectionKey;
type FieldErrors = EditorFieldErrors;

type ActionResult = {
  readonly ok: false;
  readonly error: string;
  readonly fieldErrors: FieldErrors;
};

function mutationResponse(result: EditorMutation): Response {
  if (result._tag === 'Rejected') {
    const body: ActionResult = {
      ok: false,
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
    return Response.json(body, { status: result.status });
  }

  const params = new URLSearchParams({
    status: result.status,
    published: result.published ? '1' : '0',
  });
  if (result.deploymentId !== undefined) {
    params.set('deploy', result.deploymentId);
  }
  if (result.uploaded !== undefined) {
    params.set('uploadedField', result.uploaded.field);
    params.set('uploadedKey', result.uploaded.image.key);
    params.set('uploadedWidth', String(result.uploaded.image.width));
    params.set('uploadedHeight', String(result.uploaded.image.height));
  }
  return redirect(`/admin?${params.toString()}`);
}

export const loader = routeHandler(function* () {
  const model = yield* loadEditor();
  return {
    ...model,
    assetOptions: model.assetListFailed
      ? fallbackImageAssets()
      : assetOptionsFromKeys(model.assetKeys),
  };
});

export const action = routeAction(function* () {
  const { request } = yield* ReactRouterContext;
  const auth = yield* Auth;
  yield* auth.checkCookie(request.headers.get('cookie'));
  const form = yield* Effect.tryPromise(() => request.formData());
  return mutationResponse(yield* submitEditor(form));
});
function StatusBanner({ search }: { search: URLSearchParams }) {
  const status = search.get('status');
  const published = search.get('published') === '1';
  const deploy = search.get('deploy');
  if (status === null) return null;
  return (
    <div
      className={`rounded-md border p-3 text-sm ${
        published
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      {status}
      {deploy && (
        <span className="ml-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs">
          deploy {deploy}
        </span>
      )}
    </div>
  );
}

function DraftBanner({
  draftLastModified,
  submitting,
}: {
  readonly draftLastModified: number | null;
  readonly submitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <p>
        You're viewing an unpublished draft.
        {draftLastModified !== null && (
          <>
            {' '}
            Last saved{' '}
            <span className="font-mono">
              {DateTime.formatIso(DateTime.makeUnsafe(draftLastModified))}
            </span>
            .
          </>
        )}
      </p>
      <Form method="post">
        <input type="hidden" name="intent" value="discard-draft" />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={submitting}
          className="bg-white"
        >
          Discard draft
        </Button>
      </Form>
    </div>
  );
}

function renderSection({
  section,
  content,
  assetOptions,
}: {
  readonly section: SectionKey;
  readonly content: SiteContent;
  readonly assetOptions: readonly AssetOption[];
}) {
  switch (section) {
    case 'meta':
      return <MetaSection name={section} defaultValue={content.meta} assets={assetOptions} />;
    case 'header':
      return (
        <HeaderSection name={section} defaultValue={content.header} assets={assetOptions} />
      );
    case 'hero':
      return <HeroSection name={section} defaultValue={content.hero} assets={assetOptions} />;
    case 'about':
      return (
        <AboutSection name={section} defaultValue={content.about} assets={assetOptions} />
      );
    case 'menu':
      return <MenuSection name={section} defaultValue={content.menu} assets={assetOptions} />;
    case 'menuPdf':
      return <MenuPdfSection name="menu" defaultValue={content.menu} assets={assetOptions} />;
    case 'location':
      return (
        <LocationSection
          name={section}
          defaultValue={content.location}
          assets={assetOptions}
        />
      );
    case 'contact':
      return (
        <ContactSection
          name={section}
          defaultValue={content.contact}
          assets={assetOptions}
        />
      );
    case 'footer':
      return (
        <FooterSection name={section} defaultValue={content.footer} assets={assetOptions} />
      );
    case 'jsonLd':
      return (
        <JsonLdSection
          name={section}
          defaultValue={content.jsonLd}
          assets={assetOptions}
        />
      );
  }
}

const sectionLabels: Record<SectionKey, string> = {
  meta: 'meta',
  header: 'header',
  hero: 'hero',
  about: 'about',
  menu: 'menu carousel',
  menuPdf: 'menu PDF',
  location: 'location',
  contact: 'contact',
  footer: 'footer',
  jsonLd: 'jsonLd',
};

export default function AdminContent() {
  const {
    content,
    contentSource,
    draftLastModified,
    assetOptions,
    assetListFailed,
    isUsingDefaults,
    railwayEnabled,
    lastDeploymentId,
    lastPublishedAt,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionResult>();
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';

  const search =
    typeof window === 'undefined'
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);

  const fieldErrors: FieldErrors =
    actionData && !actionData.ok ? actionData.fieldErrors : {};

  const detailsRefs = useRef<Partial<Record<SectionKey, HTMLDetailsElement>>>({});

  // After a failed save, scroll the first invalid section into view.
  useEffect(() => {
    if (!actionData || actionData.ok) return;
    const firstBroken = SECTIONS.find((k) => fieldErrors[k]?.length);
    if (!firstBroken) return;
    const details = detailsRefs.current[firstBroken];
    if (details) {
      details.open = true;
      details.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [actionData, fieldErrors]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Site content</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Edit bilingual copy, structured references, and image assets. Drafts
          stay private to admin; publishing writes the live content and can
          trigger a Railway redeploy.
        </p>
        {isUsingDefaults && (
          <p className="mt-2 inline-block rounded bg-sky-50 px-2 py-1 text-xs text-sky-800">
            Currently serving bundled defaults — no <code>content/site.json</code>{' '}
            in bucket yet.
          </p>
        )}
        {!railwayEnabled && (
          <p className="mt-2 inline-block rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
            Railway redeploy not configured. Saving will write the bucket only.
          </p>
        )}
        {assetListFailed && (
          <p className="mt-2 inline-block rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
            Bucket asset listing failed. Image pickers are showing managed
            fallback assets.
          </p>
        )}
        {lastDeploymentId && (
          <p className="mt-2 text-xs text-neutral-500">
            Last deploy:{' '}
            <span className="font-mono text-neutral-700">{lastDeploymentId}</span>
            {lastPublishedAt && (
              <>
                {' '}
                at{' '}
                <span className="font-mono text-neutral-700">
                  {DateTime.formatIso(DateTime.makeUnsafe(lastPublishedAt))}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <StatusBanner search={search} />

      {contentSource === 'draft' && (
        <DraftBanner draftLastModified={draftLastModified} submitting={submitting} />
      )}

      {actionData && !actionData.ok && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <strong>Save failed:</strong> {actionData.error}
        </div>
      )}

      <Form
        id={MENU_PDF_UPLOAD_FORM_ID}
        method="post"
        encType="multipart/form-data"
        className="hidden"
      >
        <input type="hidden" name="intent" value="upload-menu-pdf" />
      </Form>

      <Form method="post" encType="multipart/form-data" className="space-y-4">
        {SECTIONS.map((key) => {
          const errors = fieldErrors[key];
          const hasError = !!errors?.length;
          const defaultOpen =
            key === 'meta' || key === 'header' || key === 'hero';
          return (
            <details
              key={key}
              ref={(el) => {
                if (el) detailsRefs.current[key] = el;
                else delete detailsRefs.current[key];
              }}
              open={hasError || defaultOpen}
              className={`rounded-lg border bg-white ${
                hasError ? 'border-rose-300' : 'border-neutral-200'
              }`}
            >
              <summary className="cursor-pointer list-none p-4 text-sm font-medium hover:bg-neutral-50">
                <span className="select-none text-neutral-500">▸</span>{' '}
                {sectionLabels[key]}
                {hasError && (
                  <span className="ml-2 inline-block rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-800">
                    {errors!.length} error{errors!.length === 1 ? '' : 's'}
                  </span>
                )}
              </summary>
              <div
                className="space-y-4 border-t border-neutral-200 p-4"
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? `${key}-errors` : undefined}
              >
                {renderSection({ section: key, content, assetOptions })}
                {hasError && (
                  <ul
                    id={`${key}-errors`}
                    className="mt-2 space-y-1 text-xs text-rose-800"
                  >
                    {errors!.map((msg, i) => (
                      <li key={i}>• {msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          );
        })}

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-neutral-200 bg-white/95 py-3 backdrop-blur">
          <p className="text-xs text-neutral-500">
            Draft writes <code>content/site.draft.json</code>. Publish writes{' '}
            <code>content/site.json</code>
            {railwayEnabled ? ' and triggers a Railway redeploy' : ''}.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              name="intent"
              value="save-draft"
              variant="outline"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button
              type="submit"
              name="intent"
              value="publish"
              disabled={submitting}
            >
              {submitting ? 'Publishing…' : 'Save & Publish'}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
