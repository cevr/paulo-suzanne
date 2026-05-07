import { Image as ImageIcon, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '~/components/ui/button';
import type { ImageRef } from '~/content/schema';
import { MANAGED_ASSETS } from '~/lib/managed-assets';

import { TextField } from './form-fields';

const IMAGE_EXTENSIONS = ['.avif', '.gif', '.jpg', '.jpeg', '.png', '.webp'];

export type AssetOption = {
  readonly key: string;
  readonly label: string;
};

export const fallbackImageAssets = (): readonly AssetOption[] =>
  MANAGED_ASSETS.filter((asset) => asset.accept.startsWith('image/')).map(
    (asset) => ({
      key: asset.key,
      label: asset.label,
    }),
  );

export const assetOptionsFromKeys = (
  keys: readonly string[],
): readonly AssetOption[] =>
  [...keys]
    .filter((key) => !key.startsWith('content/'))
    .filter((key) =>
      IMAGE_EXTENSIONS.some((extension) =>
        key.toLowerCase().endsWith(extension),
      ),
    )
    .map((key) => ({
      key,
      label: MANAGED_ASSETS.find((asset) => asset.key === key)?.label ?? key,
    }))
    .sort((a: AssetOption, b: AssetOption) => a.key.localeCompare(b.key));

function imageUrl(key: string): string {
  return `/${key}`;
}

export function ImageRefField({
  name,
  defaultValue,
  label,
  assets,
}: {
  readonly name: string;
  readonly defaultValue: ImageRef;
  readonly label: string;
  readonly assets: readonly AssetOption[];
}) {
  const [selected, setSelected] = useState({
    key: defaultValue.key,
    width: defaultValue.width,
    height: defaultValue.height,
  });
  const [dimensions, setDimensions] = useState<
    Readonly<Record<string, { readonly width: number; readonly height: number }>>
  >({
    [defaultValue.key]: {
      width: defaultValue.width,
      height: defaultValue.height,
    },
  });
  const [open, setOpen] = useState(false);

  return (
    <fieldset className="space-y-3 rounded-md border border-neutral-200 p-4">
      <legend className="px-1 text-sm font-semibold text-neutral-900">
        {label}
      </legend>

      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <img
          src={imageUrl(selected.key)}
          alt=""
          loading="lazy"
          className="h-28 w-32 rounded-md border border-neutral-200 bg-neutral-100 object-cover"
        />
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              <ImageIcon className="size-4" aria-hidden />
              Pick image
            </Button>
            <span className="break-all font-mono text-xs text-neutral-500">
              {selected.key}
            </span>
          </div>
          <input type="hidden" name={`${name}.key`} value={selected.key} />
          <input type="hidden" name={`${name}.width`} value={selected.width} />
          <input type="hidden" name={`${name}.height`} value={selected.height} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-neutral-700">Width</span>
              <span className="block rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-700">
                {selected.width}
              </span>
            </div>
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-neutral-700">Height</span>
              <span className="block rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-700">
                {selected.height}
              </span>
            </div>
          </div>
        </div>
      </div>

      <TextField name={`${name}.alt`} defaultValue={defaultValue.alt} label="Alt text" />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Pick image for ${label}`}
            className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <h3 className="text-base font-semibold">Pick image</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                title="Close"
                onClick={() => setOpen(false)}
                className="size-9"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <div className="grid max-h-[70vh] gap-3 overflow-y-auto p-4 sm:grid-cols-2 md:grid-cols-3">
              {assets.map((asset) => (
                <button
                  key={asset.key}
                  type="button"
                  onClick={() => {
                    const knownDimensions = dimensions[asset.key];
                    setSelected((current) => ({
                      key: asset.key,
                      width: knownDimensions?.width ?? current.width,
                      height: knownDimensions?.height ?? current.height,
                    }));
                    setOpen(false);
                  }}
                  className="group cursor-pointer overflow-hidden rounded-md border border-neutral-200 bg-white text-left transition-colors hover:border-neutral-900"
                >
                  <img
                    src={imageUrl(asset.key)}
                    alt=""
                    loading="lazy"
                    onLoad={(event) => {
                      const image = event.currentTarget;
                      const nextDimensions = {
                        width: image.naturalWidth,
                        height: image.naturalHeight,
                      };
                      setDimensions((current) => ({
                        ...current,
                        [asset.key]: nextDimensions,
                      }));
                      if (selected.key === asset.key) {
                        setSelected({ key: asset.key, ...nextDimensions });
                      }
                    }}
                    className="aspect-square w-full bg-neutral-100 object-cover"
                  />
                  <span className="block truncate px-3 py-2 text-sm font-medium text-neutral-800">
                    {asset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
