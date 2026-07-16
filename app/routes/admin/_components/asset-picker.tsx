import { Check, Image as ImageIcon, Upload } from 'lucide-react';
import { useState } from 'react';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { imageUploadIntent, type EditorAsset } from '~/content/editor-contract';
import type { ImageRef } from '~/content/schema';
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  ADMIN_IMAGE_UPLOAD_PREFIX,
  thumbnailKeyForImage,
} from '~/lib/admin-image-upload';

import { TextField } from './form-fields';

function imageUrl(key: string): string {
  return `/${key}`;
}

function previewImageUrl(key: string): string {
  if (key.startsWith(`${ADMIN_IMAGE_UPLOAD_PREFIX}/`)) {
    return imageUrl(thumbnailKeyForImage(key));
  }
  return imageUrl(key);
}

function isFullAssetImage(
  image: HTMLImageElement,
  key: string,
  baseUrl: string,
): boolean {
  return image.currentSrc === new URL(imageUrl(key), baseUrl).href;
}

function imageDimensions(image: HTMLImageElement): {
  readonly width: number;
  readonly height: number;
} {
  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
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
  readonly assets: readonly EditorAsset[];
}) {
  const [selected, setSelected] = useState({
    key: defaultValue.key,
    width: defaultValue.width,
    height: defaultValue.height,
  });
  const [dimensions, setDimensions] = useState<
    Readonly<
      Record<string, { readonly width: number; readonly height: number }>
    >
  >({
    [defaultValue.key]: {
      width: defaultValue.width,
      height: defaultValue.height,
    },
  });
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<File | null>(null);
  const selectedLabel =
    assets.find((asset) => asset.key === selected.key)?.label ??
    'Current image';

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-neutral-900">
        {label}
      </legend>

      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <img
          src={imageUrl(selected.key)}
          alt=""
          loading="lazy"
          onLoad={(event) => {
            const nextDimensions = imageDimensions(event.currentTarget);
            setDimensions((current) => ({
              ...current,
              [selected.key]: nextDimensions,
            }));
            setSelected((current) =>
              current.key === selected.key
                ? { key: selected.key, ...nextDimensions }
                : current,
            );
          }}
          className="aspect-square w-full rounded-lg border border-neutral-200 bg-neutral-100 object-cover"
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              <ImageIcon className="size-4" aria-hidden />
              Choose from library
            </Button>
            <span className="text-sm text-neutral-600">
              Selected:{' '}
              <strong className="font-medium text-neutral-900">
                {selectedLabel}
              </strong>
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="file"
              name={`${name}.__file`}
              accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
              onChange={(event) => {
                setPicked(event.currentTarget.files?.[0] ?? null);
              }}
              className="cursor-pointer sm:max-w-[18rem]"
            />
            <Button
              type="submit"
              name="intent"
              value={imageUploadIntent(name)}
              variant="outline"
              disabled={picked === null}
              className="w-full sm:w-auto"
            >
              <Upload className="size-4" aria-hidden />
              Upload new image
            </Button>
          </div>
          <input type="hidden" name={`${name}.key`} value={selected.key} />
          <input type="hidden" name={`${name}.width`} value={selected.width} />
          <input
            type="hidden"
            name={`${name}.height`}
            value={selected.height}
          />
          <p className="text-xs text-neutral-500">
            JPG, PNG, WebP, GIF, or AVIF. The editor prepares uploaded images
            automatically.
          </p>
        </div>
      </div>

      <TextField
        name={`${name}.alt`}
        defaultValue={defaultValue.alt}
        label="Alt text"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
          <DialogHeader className="border-b border-neutral-200 p-5 pr-14">
            <DialogTitle>Choose an image</DialogTitle>
            <DialogDescription>
              Select an image from the website library for {label.toLowerCase()}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-3 overflow-y-auto p-4 sm:grid-cols-2 md:grid-cols-3">
            {assets.map((asset) => (
              <button
                key={asset.key}
                type="button"
                data-marks-dirty
                onClick={() => {
                  const knownDimensions = dimensions[asset.key];
                  setSelected((current) => ({
                    key: asset.key,
                    width: knownDimensions?.width ?? current.width,
                    height: knownDimensions?.height ?? current.height,
                  }));
                  setOpen(false);
                }}
                aria-pressed={selected.key === asset.key}
                className="group relative min-h-11 cursor-pointer overflow-hidden rounded-lg border border-neutral-200 bg-white text-left transition-colors hover:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 aria-pressed:border-neutral-900 aria-pressed:ring-2 aria-pressed:ring-neutral-900"
              >
                {selected.key === asset.key && (
                  <span className="absolute top-2 right-2 z-10 grid size-8 place-items-center rounded-full bg-neutral-900 text-white shadow-sm">
                    <Check className="size-4" aria-hidden />
                    <span className="sr-only">Selected</span>
                  </span>
                )}
                <img
                  src={previewImageUrl(asset.key)}
                  alt=""
                  loading="lazy"
                  onLoad={(event) => {
                    if (
                      !isFullAssetImage(
                        event.currentTarget,
                        asset.key,
                        window.location.href,
                      )
                    ) {
                      return;
                    }
                    const nextDimensions = imageDimensions(event.currentTarget);
                    setDimensions((current) => ({
                      ...current,
                      [asset.key]: nextDimensions,
                    }));
                    if (selected.key === asset.key) {
                      setSelected({ key: asset.key, ...nextDimensions });
                    }
                  }}
                  onError={(event) => {
                    const image = event.currentTarget;
                    const fallback = imageUrl(asset.key);
                    if (
                      !isFullAssetImage(image, asset.key, window.location.href)
                    ) {
                      image.src = fallback;
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
          {assets.length === 0 && (
            <p className="p-6 text-center text-sm text-neutral-600">
              No library images are available yet. Close this window and upload
              one instead.
            </p>
          )}
          <div className="border-t border-neutral-200 px-5 py-3 text-xs text-neutral-500">
            Press Escape to close without changing the image.
          </div>
        </DialogContent>
      </Dialog>
    </fieldset>
  );
}
