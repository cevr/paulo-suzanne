import { Effect } from 'effect';
import { useEffect, useState } from 'react';
import { Form, redirect, useLoaderData, useNavigation } from 'react-router';

import { MANAGED_ASSETS, findAsset, type ManagedAsset } from '~/lib/managed-assets';
import { ReactRouterContext } from '~/lib/effect/router-context';
import { routeAction, routeHandler } from '~/lib/effect/route';
import { Storage } from '~/services/Storage';

type AssetState = {
  key: string;
  label: string;
  group: 'menu' | 'atmosphere' | 'food';
  inBucket: boolean;
  version: string;
};

export const loader = routeHandler(function* () {
  const storage = yield* Storage;

  const states = yield* Effect.forEach(
    MANAGED_ASSETS,
    (asset) =>
      storage.head(asset.key).pipe(
        Effect.map((head): AssetState => ({
          key: asset.key,
          label: asset.label,
          group: asset.group,
          inBucket: head !== null,
          version:
            head !== null ?
              encodeURIComponent(head.etag.replace(/^"|"$/g, ''))
            : 'bundled',
        })),
        Effect.catch(() =>
          Effect.succeed<AssetState>({
            key: asset.key,
            label: asset.label,
            group: asset.group,
            inBucket: false,
            version: 'bundled',
          }),
        ),
      ),
    { concurrency: 8 },
  );

  return { assets: states };
});

export const action = routeAction(function* () {
  const { request } = yield* ReactRouterContext;
  const storage = yield* Storage;

  const form = yield* Effect.tryPromise(() => request.formData());
  const key = String(form.get('key') ?? '');
  const file = form.get('file');

  const asset = findAsset(key);
  if (asset === undefined) {
    return Response.json({ error: 'Unknown asset key' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: 'No file' }, { status: 400 });
  }

  const buf = yield* Effect.tryPromise(() => file.arrayBuffer());
  const contentType = file.type || 'application/octet-stream';
  yield* storage.put(asset.key, new Uint8Array(buf), contentType);

  return redirect('/admin');
});

function GroupLabel({ group }: { group: AssetState['group'] }) {
  if (group === 'menu') return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs">menu</span>;
  if (group === 'atmosphere') return <span className="rounded bg-sky-100 px-2 py-0.5 text-xs">atmosphere</span>;
  return <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs">food</span>;
}

const PREVIEW_BOX = 'flex h-20 w-28 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-xs text-neutral-600';

function CurrentPreview({ asset }: { asset: AssetState }) {
  const src = `/${asset.key}?v=${asset.version}`;
  if (asset.group === 'menu') {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className={`${PREVIEW_BOX} hover:bg-neutral-100`}>
        Open PDF
      </a>
    );
  }
  return (
    <img
      src={src}
      alt={asset.label}
      loading="lazy"
      className={`${PREVIEW_BOX} object-cover`}
    />
  );
}

function NewPreview({ file, group }: { file: File; group: AssetState['group'] }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objUrl = URL.createObjectURL(file);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [file]);

  if (url === null) return <div className={PREVIEW_BOX}>…</div>;
  if (group === 'menu') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`${PREVIEW_BOX} hover:bg-neutral-100`}>
        New PDF
      </a>
    );
  }
  return (
    <img
      src={url}
      alt={`new ${file.name}`}
      className={`${PREVIEW_BOX} object-cover ring-2 ring-emerald-400`}
    />
  );
}

function AssetRow({ asset, def, submitting }: { asset: AssetState; def: ManagedAsset | undefined; submitting: boolean }) {
  const [picked, setPicked] = useState<File | null>(null);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex flex-shrink-0 items-center gap-2">
          <CurrentPreview asset={asset} />
          {picked !== null && (
            <>
              <span className="text-neutral-400" aria-hidden>→</span>
              <NewPreview file={picked} group={asset.group} />
            </>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GroupLabel group={asset.group} />
            <h3 className="truncate text-sm font-medium">{asset.label}</h3>
          </div>
          <p className="mt-1 truncate text-xs text-neutral-500">/{asset.key}</p>
          <p className="mt-1 text-xs">
            {asset.inBucket ? (
              <span className="text-emerald-700">In bucket</span>
            ) : (
              <span className="text-neutral-500">Using bundled file</span>
            )}
          </p>
        </div>
      </div>

      <Form method="post" encType="multipart/form-data" className="flex flex-shrink-0 items-center gap-2">
        <input type="hidden" name="key" value={asset.key} />
        <input
          type="file"
          name="file"
          accept={def?.accept}
          required
          onChange={(e) => {
            const f = e.currentTarget.files?.[0] ?? null;
            setPicked(f);
          }}
          className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-neutral-700"
        />
        <button
          type="submit"
          disabled={submitting || picked === null}
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 disabled:opacity-50"
        >
          {submitting ? 'Uploading…' : 'Upload'}
        </button>
      </Form>
    </li>
  );
}

export default function AdminIndex() {
  const { assets } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Site assets</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Upload to replace. Files in the bucket override what's bundled with the site. If the bucket is empty for a slot, the bundled file is served instead.
        </p>
      </div>

      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {assets.map((a) => (
          <AssetRow key={a.key} asset={a} def={findAsset(a.key)} submitting={submitting} />
        ))}
      </ul>
    </div>
  );
}
