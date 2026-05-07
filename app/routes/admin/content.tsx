import { Cause, Effect, Schema } from 'effect';
import { useState } from 'react';
import { Form, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';

import { loadContent } from '~/content/loader';
import { defaultContent } from '~/content/defaults';
import {
  hashContent,
  IN_FLIGHT_TIMEOUT_MS,
  PUBLISH_STATE_KEY,
  PublishState,
} from '~/content/publish-state';
import { SiteContent } from '~/content/schema';
import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { Auth } from '~/services/Auth';
import { Railway, RailwayDisabled, RailwayError } from '~/services/Railway';
import { Storage } from '~/services/Storage';

const CONTENT_KEY = 'content/site.json';

const decodePublishState = Schema.decodeUnknownEffect(
  Schema.fromJsonString(PublishState),
);
const encodePublishState = (state: PublishState) =>
  JSON.stringify(state, null, 2);

const readPublishState = Effect.fn('readPublishState')(function* () {
  const storage = yield* Storage;
  const exit = yield* Effect.exit(
    Effect.gen(function* () {
      const obj = yield* storage.get(PUBLISH_STATE_KEY);
      const text = yield* Effect.promise(() =>
        new Response(obj.stream).text(),
      );
      return yield* decodePublishState(text);
    }),
  );
  if (exit._tag === 'Success') return exit.value;
  // Treat any failure (NotFound, parse error, schema mismatch) as "no state".
  return null;
});

const SECTIONS = [
  'meta',
  'header',
  'hero',
  'about',
  'menu',
  'location',
  'contact',
  'footer',
  'jsonLd',
] as const;

type SectionKey = (typeof SECTIONS)[number];

type ActionResult =
  | { ok: true; published: boolean; message: string }
  | { ok: false; error: string; field?: SectionKey };

const decodeContent = Schema.decodeUnknownEffect(SiteContent);

export const loader = routeHandler(function* () {
  const content = yield* Effect.promise(() => loadContent());
  const railway = yield* Railway;
  const railwayEnabled = yield* railway.enabled;
  const publishState = yield* readPublishState();
  return {
    content,
    isUsingDefaults:
      JSON.stringify(content) === JSON.stringify(defaultContent),
    railwayEnabled,
    lastDeploymentId: publishState?.lastDeploymentId ?? null,
    lastPublishedAt: publishState?.lastPublishedAt ?? null,
  };
});

export const action = routeAction(function* () {
  const { request } = yield* ReactRouterContext;
  const auth = yield* Auth;
  yield* auth.checkCookie(request.headers.get('cookie'));

  const storage = yield* Storage;
  const railway = yield* Railway;

  const form = yield* Effect.tryPromise(() => request.formData());

  // Reassemble content from per-section JSON blobs.
  const draft: Record<string, unknown> = {};
  for (const key of SECTIONS) {
    const raw = form.get(key);
    if (typeof raw !== 'string' || raw.trim() === '') {
      const result: ActionResult = {
        ok: false,
        error: `Section "${key}" is empty`,
        field: key,
      };
      return Response.json(result, { status: 400 });
    }
    try {
      draft[key] = JSON.parse(raw) as unknown;
    } catch (e) {
      const result: ActionResult = {
        ok: false,
        error: `Section "${key}" is not valid JSON: ${String(e)}`,
        field: key,
      };
      return Response.json(result, { status: 400 });
    }
  }

  const decodeExit = yield* Effect.exit(decodeContent(draft));
  if (decodeExit._tag !== 'Success') {
    const result: ActionResult = {
      ok: false,
      error: `Schema validation failed: ${String(decodeExit.cause)}`,
    };
    return Response.json(result, { status: 400 });
  }

  const content = decodeExit.value;
  const newHash = hashContent(content);

  // Read existing publish-state to drive idempotency + best-effort lock.
  const prevState = yield* readPublishState();
  const now = Date.now();

  // Idempotency: identical content → no rewrite, no redeploy.
  if (prevState && prevState.contentHash === newHash) {
    const idempotentMessage =
      prevState.lastDeploymentId
        ? `No changes — last deploy ${prevState.lastDeploymentId} still represents this content.`
        : 'No changes — content already saved.';
    return redirect(
      `/admin/content?status=${encodeURIComponent(idempotentMessage)}&published=1${prevState.lastDeploymentId ? `&deploy=${encodeURIComponent(prevState.lastDeploymentId)}` : ''}`,
    );
  }

  // Best-effort concurrency guard: if another publish is in flight (within
  // IN_FLIGHT_TIMEOUT_MS), reject. Past the timeout we assume that publish
  // crashed and let this one proceed.
  if (
    prevState &&
    prevState.inFlight &&
    now - prevState.inFlight.startedAt < IN_FLIGHT_TIMEOUT_MS
  ) {
    const result: ActionResult = {
      ok: false,
      error:
        'Another publish is already in flight (started <90s ago). Wait for it to finish, then retry.',
    };
    return Response.json(result, { status: 409 });
  }

  // Mark publish as in-flight before we touch anything else. If we crash
  // between here and the final state write, the next publish past the
  // timeout window converges.
  const inFlightState: PublishState = {
    contentHash: prevState?.contentHash ?? null,
    lastDeploymentId: prevState?.lastDeploymentId ?? null,
    lastPublishedAt: prevState?.lastPublishedAt ?? null,
    inFlight: { hash: newHash, startedAt: now },
  };
  yield* storage.put(
    PUBLISH_STATE_KEY,
    encodePublishState(inFlightState),
    'application/json',
  );

  // Write content. Build will pick this up on the next deploy.
  const json = JSON.stringify(content, null, 2);
  yield* storage.put(CONTENT_KEY, json, 'application/json');

  // Trigger redeploy. If Railway isn't configured, treat as save-only.
  const deployExit = yield* Effect.exit(railway.triggerDeploy);
  let deploymentId: string | null = null;
  let message: string;
  let published = false;
  if (deployExit._tag === 'Success') {
    deploymentId = deployExit.value.deploymentId;
    published = true;
    message = `Saved and deploy ${deploymentId} queued. New site live in ~60s.`;
  } else {
    let detail = 'unknown error';
    for (const reason of deployExit.cause.reasons) {
      if (Cause.isFailReason(reason)) {
        const err = reason.error as unknown;
        if (err instanceof RailwayDisabled) {
          detail = 'Railway not configured — no redeploy.';
        } else if (err instanceof RailwayError) {
          detail = `redeploy failed: ${err.message}`;
        }
      }
    }
    message = `Saved to bucket. ${detail}`;
  }

  // Final state: only stamp contentHash if Railway succeeded OR Railway is
  // disabled. If Railway errored we keep prevState.contentHash so the editor
  // can retry; clearing inFlight either way unblocks the next publish.
  const railwaySucceededOrDisabled =
    deployExit._tag === 'Success' ||
    (deployExit._tag === 'Failure' &&
      [...deployExit.cause.reasons].some(
        (r) =>
          Cause.isFailReason(r) &&
          (r.error as unknown) instanceof RailwayDisabled,
      ));

  const finalState: PublishState = {
    contentHash: railwaySucceededOrDisabled
      ? newHash
      : (prevState?.contentHash ?? null),
    lastDeploymentId: deploymentId ?? prevState?.lastDeploymentId ?? null,
    lastPublishedAt: railwaySucceededOrDisabled
      ? now
      : (prevState?.lastPublishedAt ?? null),
    inFlight: null,
  };
  yield* storage.put(
    PUBLISH_STATE_KEY,
    encodePublishState(finalState),
    'application/json',
  );

  const params = new URLSearchParams({
    status: message,
    published: published ? '1' : '0',
  });
  if (deploymentId) params.set('deploy', deploymentId);
  return redirect(`/admin/content?${params.toString()}`);
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

export default function AdminContent() {
  const {
    content,
    isUsingDefaults,
    railwayEnabled,
    lastDeploymentId,
    lastPublishedAt,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionResult>();
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';

  const [drafts, setDrafts] = useState<Record<SectionKey, string>>(() =>
    Object.fromEntries(
      SECTIONS.map((k) => [k, JSON.stringify(content[k], null, 2)]),
    ) as Record<SectionKey, string>,
  );

  const search =
    typeof window === 'undefined'
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Site content</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Edit bilingual copy and structured references. Each section is a JSON
          blob validated against the schema. Saving triggers a Railway redeploy
          so the new content gets baked into the prerendered HTML.
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
        {lastDeploymentId && (
          <p className="mt-2 text-xs text-neutral-500">
            Last deploy:{' '}
            <span className="font-mono text-neutral-700">{lastDeploymentId}</span>
            {lastPublishedAt && (
              <>
                {' '}
                at{' '}
                <span className="font-mono text-neutral-700">
                  {new Date(lastPublishedAt).toISOString()}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <StatusBanner search={search} />

      {actionData && !actionData.ok && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <strong>Save failed:</strong> {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-4">
        {SECTIONS.map((key) => (
          <details
            key={key}
            open={key === 'meta' || key === 'header' || key === 'hero'}
            className="rounded-lg border border-neutral-200 bg-white"
          >
            <summary className="cursor-pointer list-none p-4 text-sm font-medium hover:bg-neutral-50">
              <span className="select-none text-neutral-500">▸</span> {key}
            </summary>
            <div className="border-t border-neutral-200 p-4">
              <textarea
                name={key}
                value={drafts[key]}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [key]: e.currentTarget.value }))
                }
                rows={Math.min(40, drafts[key].split('\n').length + 2)}
                spellCheck={false}
                className="block w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs text-neutral-900 focus:border-neutral-900 focus:bg-white focus:outline-none"
              />
            </div>
          </details>
        ))}

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-neutral-200 bg-white/95 py-3 backdrop-blur">
          <p className="text-xs text-neutral-500">
            Save writes <code>content/site.json</code> to the bucket and{' '}
            {railwayEnabled
              ? 'triggers a Railway redeploy'
              : '(redeploy disabled)'}
            .
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Publishing…' : 'Save & Publish'}
          </button>
        </div>
      </Form>
    </div>
  );
}
