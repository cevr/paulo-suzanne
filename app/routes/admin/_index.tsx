import { DateTime, Effect } from 'effect';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Save,
  Send,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Form,
  redirect,
  useActionData,
  useBlocker,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Spinner } from '~/components/ui/spinner';
import {
  loadEditor,
  submitEditor,
  type EditorFieldErrors,
  type EditorMutation,
} from '~/content/editor';
import {
  EDITOR_SECTION_KEYS,
  type EditorSectionKey,
} from '~/content/editor-sections';
import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { cn } from '~/lib/utils';
import { Auth } from '~/services/Auth';

import { editorSections } from './_components/editor-sections';
import { MENU_PDF_UPLOAD_FORM_ID } from './_components/sections';

type FieldErrors = EditorFieldErrors;

type ActionResult = {
  readonly ok: false;
  readonly error: string;
  readonly fieldErrors: FieldErrors;
};

const DEFAULT_SECTION: EditorSectionKey = 'hero';
const CONTENT_SECTION_KEYS: readonly EditorSectionKey[] = [
  'hero',
  'header',
  'about',
  'menu',
  'menuPdf',
  'location',
  'contact',
  'footer',
];
const SETTINGS_SECTION_KEYS: readonly EditorSectionKey[] = ['meta', 'jsonLd'];

function isEditorSection(value: string | null): value is EditorSectionKey {
  return EDITOR_SECTION_KEYS.some((section) => section === value);
}

function mutationResponse(
  result: EditorMutation,
  section: EditorSectionKey,
): Response {
  if (result._tag === 'Rejected') {
    const body: ActionResult = {
      ok: false,
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
    return Response.json(body, { status: result.status });
  }

  const params = new URLSearchParams({
    section,
    status: result.status,
    published: result.published ? '1' : '0',
  });
  return redirect(`/admin?${params.toString()}`);
}

export const loader = routeHandler(function* () {
  return yield* loadEditor();
});

export const action = routeAction(function* () {
  const { request } = yield* ReactRouterContext;
  const auth = yield* Auth;
  yield* auth.checkCookie(request.headers.get('cookie'));
  const form = yield* Effect.tryPromise(() => request.formData());
  const requestedSection = String(form.get('_section'));
  const section = isEditorSection(requestedSection)
    ? requestedSection
    : DEFAULT_SECTION;
  return mutationResponse(yield* submitEditor(form), section);
});

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(DateTime.toDate(DateTime.makeUnsafe(timestamp)));
}

function StatusBanner({ search }: { readonly search: URLSearchParams }) {
  const status = search.get('status');
  const published = search.get('published') === '1';
  if (status === null) return null;

  return (
    <Alert
      className={
        published
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-blue-200 bg-blue-50'
      }
    >
      <CheckCircle2
        className={published ? 'text-emerald-700' : 'text-blue-700'}
      />
      <AlertTitle>{published ? 'Website published' : 'Draft saved'}</AlertTitle>
      <AlertDescription>{status}</AlertDescription>
    </Alert>
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
    <Alert className="border-amber-200 bg-amber-50">
      <Info className="text-amber-800" />
      <AlertTitle>You’re editing a saved draft</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Visitors cannot see these changes yet
          {draftLastModified === null
            ? '.'
            : ` · Last saved ${formatDate(draftLastModified)}.`}
        </span>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white"
            >
              Discard draft
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Discard this draft?</DialogTitle>
              <DialogDescription>
                Every unpublished change will be removed. Your live website will
                stay as it is.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Keep editing
                </Button>
              </DialogClose>
              <Form method="post">
                <input type="hidden" name="intent" value="discard-draft" />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={submitting}
                >
                  Discard draft
                </Button>
              </Form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AlertDescription>
    </Alert>
  );
}

function SectionNavigation({
  activeSection,
  fieldErrors,
  onSelect,
}: {
  readonly activeSection: EditorSectionKey;
  readonly fieldErrors: FieldErrors;
  readonly onSelect: (section: EditorSectionKey) => void;
}) {
  const sectionByKey = new Map(
    editorSections.map((section) => [section.key, section]),
  );
  const renderGroup = (label: string, keys: readonly EditorSectionKey[]) => (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      {keys.map((key) => {
        const section = sectionByKey.get(key);
        if (section === undefined) return null;
        const errorCount = fieldErrors[key]?.length ?? 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-current={activeSection === key ? 'page' : undefined}
            className={cn(
              'flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900',
              activeSection === key
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950',
            )}
          >
            <span>{section.label}</span>
            {errorCount > 0 && (
              <Badge variant="destructive" className="border-0">
                {errorCount}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <nav aria-label="Website sections" className="flex flex-col gap-6">
      {renderGroup('Website content', CONTENT_SECTION_KEYS)}
      {renderGroup('Search settings', SETTINGS_SECTION_KEYS)}
    </nav>
  );
}

export default function AdminContent() {
  const {
    content,
    contentSource,
    draftLastModified,
    assets,
    assetCatalogStatus,
    isUsingDefaults,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionResult>();
  const navigation = useNavigation();
  const [search, setSearch] = useSearchParams();
  const [isDirty, setIsDirty] = useState(false);
  const requestedSection = search.get('section');
  const [activeSection, setActiveSection] = useState<EditorSectionKey>(() =>
    isEditorSection(requestedSection) ? requestedSection : DEFAULT_SECTION,
  );
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );
  const submitting = navigation.state === 'submitting';

  const fieldErrors: FieldErrors =
    actionData && !actionData.ok ? actionData.fieldErrors : {};

  const selectSection = useCallback(
    (section: EditorSectionKey) => {
      setActiveSection(section);
      setSearch((current) => {
        const next = new URLSearchParams(current);
        next.set('section', section);
        return next;
      });
    },
    [setSearch],
  );

  useEffect(() => {
    setActiveSection(
      isEditorSection(requestedSection) ? requestedSection : DEFAULT_SECTION,
    );
  }, [requestedSection]);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [isDirty]);

  useEffect(() => {
    if (!actionData || actionData.ok) return;
    const firstBroken = EDITOR_SECTION_KEYS.find(
      (key) => fieldErrors[key]?.length,
    );
    if (firstBroken === undefined) return;
    setActiveSection(firstBroken);
    const url = new URL(window.location.href);
    url.searchParams.set('section', firstBroken);
    window.history.replaceState(window.history.state, '', url);
    window.setTimeout(() => {
      const field = document.querySelector<HTMLElement>(
        `[name^="${firstBroken}."]`,
      );
      field?.focus();
    }, 0);
  }, [actionData, fieldErrors]);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              Your unsaved changes will be lost if you leave the website editor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => blocker.state === 'blocked' && blocker.reset()}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => blocker.state === 'blocked' && blocker.proceed()}
            >
              Leave without saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-neutral-500">Website editor</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
            Make your website feel up to date
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Choose a section, make your changes in English and French, then save
            a private draft or publish it for visitors.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/" target="_blank" rel="noopener noreferrer">
            View live website
            <ExternalLink aria-hidden />
          </a>
        </Button>
      </div>

      <StatusBanner search={search} />

      {contentSource === 'draft' && (
        <DraftBanner
          draftLastModified={draftLastModified}
          submitting={submitting}
        />
      )}

      {actionData && !actionData.ok && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>We couldn’t save these changes</AlertTitle>
          <AlertDescription>
            {actionData.error} Open the highlighted section and check the marked
            information.
          </AlertDescription>
        </Alert>
      )}

      {(isUsingDefaults || assetCatalogStatus === 'fallback') && (
        <Alert>
          <Info />
          <AlertTitle>
            {isUsingDefaults
              ? 'Ready for your first save'
              : 'Image library unavailable'}
          </AlertTitle>
          <AlertDescription>
            {isUsingDefaults
              ? 'The website is using its original content. Your first save will create an editable version.'
              : 'You can keep editing. Existing website images remain available while the library reconnects.'}
          </AlertDescription>
        </Alert>
      )}

      <Form
        id={MENU_PDF_UPLOAD_FORM_ID}
        method="post"
        encType="multipart/form-data"
        className="hidden"
      >
        <input type="hidden" name="intent" value="upload-menu-pdf" />
      </Form>

      <Form
        method="post"
        encType="multipart/form-data"
        className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]"
        onChange={() => setIsDirty(true)}
        onInput={() => setIsDirty(true)}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('[data-marks-dirty]')) {
            setIsDirty(true);
          }
        }}
      >
        <input type="hidden" name="_section" value={activeSection} />

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            <SectionNavigation
              activeSection={activeSection}
              fieldErrors={fieldErrors}
              onSelect={selectSection}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <label className="mb-4 flex flex-col gap-1.5 lg:hidden">
            <span className="text-sm font-medium text-neutral-800">
              Editing section
            </span>
            <select
              value={activeSection}
              onChange={(event) =>
                selectSection(event.currentTarget.value as EditorSectionKey)
              }
              className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <optgroup label="Website content">
                {CONTENT_SECTION_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {
                      editorSections.find((section) => section.key === key)
                        ?.label
                    }
                  </option>
                ))}
              </optgroup>
              <optgroup label="Search settings">
                {SETTINGS_SECTION_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {
                      editorSections.find((section) => section.key === key)
                        ?.label
                    }
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          {editorSections.map((section) => {
            const errors = fieldErrors[section.key];
            const hasError = (errors?.length ?? 0) > 0;
            return (
              <section
                key={section.key}
                hidden={section.key !== activeSection}
                aria-labelledby={`${section.key}-heading`}
                className={cn(
                  'rounded-xl border bg-white shadow-sm',
                  hasError ? 'border-red-300' : 'border-neutral-200',
                )}
              >
                <div className="border-b border-neutral-200 px-5 py-5 sm:px-7">
                  <div className="flex items-center gap-3">
                    <h2
                      id={`${section.key}-heading`}
                      className="text-xl font-semibold text-neutral-950"
                    >
                      {section.label}
                    </h2>
                    {hasError && (
                      <Badge variant="destructive">Needs attention</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    {section.description}
                  </p>
                </div>
                <div
                  className="flex flex-col gap-5 p-5 sm:p-7"
                  aria-invalid={hasError || undefined}
                  aria-describedby={
                    hasError ? `${section.key}-errors` : undefined
                  }
                >
                  {section.render(content, assets)}
                  {hasError && (
                    <Alert id={`${section.key}-errors`} variant="destructive">
                      <AlertCircle />
                      <AlertTitle>Please check this section</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-4">
                          {errors?.map((message, index) => (
                            <li key={index}>{message}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </section>
            );
          })}

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur">
            <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <span
                  className={cn(
                    'size-2 rounded-full',
                    isDirty ? 'bg-amber-500' : 'bg-emerald-500',
                  )}
                />
                {isDirty ? 'You have unsaved changes' : 'All changes are saved'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="submit"
                  name="intent"
                  value="save-draft"
                  variant="outline"
                  disabled={submitting}
                >
                  {submitting ? <Spinner /> : <Save aria-hidden />}
                  Save draft
                </Button>
                <Button
                  type="submit"
                  name="intent"
                  value="publish"
                  disabled={submitting}
                >
                  {submitting ? <Spinner /> : <Send aria-hidden />}
                  Publish website
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
