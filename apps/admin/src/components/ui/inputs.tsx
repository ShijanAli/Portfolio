import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** One look for every text-like control. */
const control =
  'w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/70 ' +
  'transition-colors hover:border-muted/50 focus:border-accent focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-9', className)} {...props} />;
}

export function Textarea({
  className,
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(control, 'resize-y py-2', className)} {...props} />;
}

export interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
  /** Label of the empty choice. Omit to force a selection. */
  placeholder?: string;
}

export function Select({ className, options, placeholder, ...props }: SelectProps) {
  return (
    <select className={cn(control, 'h-9 cursor-pointer', className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
