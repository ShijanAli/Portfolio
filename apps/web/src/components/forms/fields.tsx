'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-2xl border border-border bg-bg/60 px-4 text-fg placeholder:text-muted/60 ' +
  'transition-colors focus:border-accent focus:outline-none aria-invalid:border-danger';

interface FieldProps {
  label: string;
  name: string;
  error?: string;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
}

/** What a control needs to be tied to its label and error message. */
interface ControlProps {
  id: string;
  name: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

/**
 * Label, control and error of one field. The id is generated, so several forms with the
 * same field names (three of them have an "email") can share a page.
 */
function Field({
  label,
  name,
  error,
  hideLabel,
  children,
}: FieldProps & { children: (props: ControlProps) => ReactNode }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className={cn('mb-2 block text-sm text-muted', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children({
        id,
        name,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  name,
  error,
  hideLabel,
  className,
  ...props
}: FieldProps & ComponentProps<'input'>) {
  return (
    <Field label={label} name={name} error={error} hideLabel={hideLabel}>
      {(fieldProps) => (
        <input {...props} {...fieldProps} className={cn(control, 'h-12', className)} />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hideLabel,
  className,
  ...props
}: FieldProps & ComponentProps<'textarea'>) {
  return (
    <Field label={label} name={name} error={error} hideLabel={hideLabel}>
      {(fieldProps) => (
        <textarea
          rows={5}
          {...props}
          {...fieldProps}
          className={cn(control, 'resize-y py-3', className)}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  name,
  error,
  hideLabel,
  className,
  options,
  placeholder,
  ...props
}: FieldProps &
  ComponentProps<'select'> & {
    options: { value: string; label: string }[];
    placeholder?: string;
  }) {
  return (
    <Field label={label} name={name} error={error} hideLabel={hideLabel}>
      {(fieldProps) => (
        <select
          {...props}
          {...fieldProps}
          className={cn(control, 'h-12 cursor-pointer', className)}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/**
 * Spam trap: a field real visitors never see or reach. The API silently drops any
 * submission that fills it in.
 */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function FormMessage({ status, message }: { status: string; message: string }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={cn('text-sm', status === 'success' ? 'text-success' : 'text-danger')}
    >
      {message}
    </p>
  );
}
