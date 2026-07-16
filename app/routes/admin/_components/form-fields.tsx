import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import type { Text } from '~/content/schema';
import { cn } from '~/lib/utils';

type FieldType = 'text' | 'url' | 'email' | 'tel';

const labelClass = 'block text-sm font-medium text-neutral-800';

function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      data-marks-dirty
      onClick={onClick}
      disabled={disabled}
      className="size-11 sm:size-10"
    >
      <Icon className="size-4" aria-hidden />
    </Button>
  );
}

export function TextField({
  name,
  defaultValue,
  label,
  multiline = false,
}: {
  readonly name: string;
  readonly defaultValue: Text;
  readonly label: string;
  readonly multiline?: boolean;
}) {
  const fieldId = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={labelClass}>{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={`${fieldId}-en`} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            English
          </span>
          {multiline ? (
            <Textarea
              id={`${fieldId}-en`}
              name={`${name}.en`}
              defaultValue={defaultValue.en}
              rows={4}
            />
          ) : (
            <Input
              id={`${fieldId}-en`}
              name={`${name}.en`}
              defaultValue={defaultValue.en}
            />
          )}
        </label>
        <label htmlFor={`${fieldId}-fr`} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            French
          </span>
          {multiline ? (
            <Textarea
              id={`${fieldId}-fr`}
              name={`${name}.fr`}
              defaultValue={defaultValue.fr}
              rows={4}
            />
          ) : (
            <Input
              id={`${fieldId}-fr`}
              name={`${name}.fr`}
              defaultValue={defaultValue.fr}
            />
          )}
        </label>
      </div>
    </fieldset>
  );
}

export function StringField({
  name,
  defaultValue,
  label,
  type = 'text',
  placeholder,
}: {
  readonly name: string;
  readonly defaultValue: string;
  readonly label: string;
  readonly type?: FieldType;
  readonly placeholder?: string;
}) {
  const fieldId = useId();
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <Input
        id={fieldId}
        name={name}
        defaultValue={defaultValue}
        type={type}
        placeholder={placeholder}
      />
    </label>
  );
}

export function NumberField({
  name,
  defaultValue,
  label,
  min,
}: {
  readonly name: string;
  readonly defaultValue: number;
  readonly label: string;
  readonly min?: number;
}) {
  const fieldId = useId();
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <Input
        id={fieldId}
        name={name}
        defaultValue={defaultValue}
        type="number"
        min={min}
      />
    </label>
  );
}

export function SelectField<T extends string>({
  name,
  defaultValue,
  label,
  options,
}: {
  readonly name: string;
  readonly defaultValue: T;
  readonly label: string;
  readonly options: readonly { readonly value: T; readonly label: string }[];
}) {
  const fieldId = useId();
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <select
        id={fieldId}
        name={name}
        defaultValue={defaultValue}
        className={cn(
          'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 lg:text-sm',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StructField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-neutral-900">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

export function ArrayField<T>({
  name,
  defaultValue,
  renderItem,
  newItem,
  label,
}: {
  readonly name: string;
  readonly defaultValue: readonly T[];
  readonly renderItem: (item: T, rowName: string) => ReactNode;
  readonly newItem: () => T;
  readonly label: string;
}) {
  const nextRowId = useRef(defaultValue.length);
  const [rows, setRows] = useState(() =>
    defaultValue.map((item, index) => ({ key: `initial-${index}`, item })),
  );
  const [removed, setRemoved] = useState<{
    readonly row: (typeof rows)[number];
    readonly index: number;
  } | null>(null);

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 sm:p-5">
      <input type="hidden" name="_array" value={name} />
      <legend className="px-1 text-sm font-semibold text-neutral-900">
        {label}
      </legend>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 sm:p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Item {index + 1}
              </span>
              <div className="flex items-center gap-1.5">
                <IconButton
                  label="Move up"
                  icon={ArrowUp}
                  disabled={index === 0}
                  onClick={() =>
                    setRows((current) => {
                      if (index === 0) return current;
                      const next = [...current];
                      const [row] = next.splice(index, 1);
                      if (row === undefined) return current;
                      next.splice(index - 1, 0, row);
                      return next;
                    })
                  }
                />
                <IconButton
                  label="Move down"
                  icon={ArrowDown}
                  disabled={index === rows.length - 1}
                  onClick={() =>
                    setRows((current) => {
                      if (index >= current.length - 1) return current;
                      const next = [...current];
                      const [row] = next.splice(index, 1);
                      if (row === undefined) return current;
                      next.splice(index + 1, 0, row);
                      return next;
                    })
                  }
                />
                <IconButton
                  label="Remove"
                  icon={Trash2}
                  onClick={() => {
                    setRemoved({ row, index });
                    setRows((current) =>
                      current.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    );
                  }}
                />
              </div>
            </div>
            {renderItem(row.item, `${name}.${index}`)}
          </div>
        ))}
      </div>
      {removed !== null && (
        <div
          role="status"
          className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white"
        >
          <span>Item removed.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-marks-dirty
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => {
              setRows((current) => {
                const next = [...current];
                next.splice(
                  Math.min(removed.index, next.length),
                  0,
                  removed.row,
                );
                return next;
              });
              setRemoved(null);
            }}
          >
            Undo
          </Button>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        data-marks-dirty
        onClick={() => {
          setRemoved(null);
          setRows((current) => [
            ...current,
            { key: `added-${nextRowId.current++}`, item: newItem() },
          ]);
        }}
      >
        <Plus className="size-4" aria-hidden />
        Add {label.toLowerCase().replace(/s$/, '')}
      </Button>
    </fieldset>
  );
}
