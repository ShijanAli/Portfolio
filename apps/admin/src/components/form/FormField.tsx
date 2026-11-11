import { lazy, Suspense, type ReactNode } from 'react';
import { Controller, type Control, type UseFormRegister } from 'react-hook-form';
import { Input, Select, Textarea } from '@/components/ui/inputs';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/cn';
import { ChipToggleGroup } from './fields/ChipToggleGroup';
import { ImageField, ImagesField } from './fields/ImageField';
import { RelationField, RelationsField } from './fields/RelationField';
import { RepeaterField } from './fields/RepeaterField';
import { TagsInput } from './TagsInput';
import type { FieldConfig, FormValues } from './types';

// The editor is large, so it is only downloaded by forms that contain rich text.
const RichTextField = lazy(() => import('./fields/RichTextField'));

/** Field types whose control manages its own value instead of being a native input. */
type CustomControl = (props: {
  id: string;
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) => ReactNode;

const asList = <T,>(value: unknown) => (Array.isArray(value) ? (value as T[]) : []);
const asText = (value: unknown) => (typeof value === 'string' ? value : '');

const CUSTOM_CONTROLS: Partial<Record<FieldConfig['type'], CustomControl>> = {
  switch: ({ id, value, onChange }) => (
    <Switch id={id} checked={Boolean(value)} onChange={onChange} />
  ),
  tags: ({ id, field, value, onChange }) => (
    <TagsInput
      id={id}
      value={asList<string>(value)}
      onChange={onChange}
      placeholder={field.placeholder}
    />
  ),
  image: ({ id, value, onChange }) => (
    <ImageField id={id} value={asText(value)} onChange={onChange} />
  ),
  images: ({ id, value, onChange }) => (
    <ImagesField id={id} value={asList<string>(value)} onChange={onChange} />
  ),
  relation: ({ id, field, value, onChange }) => (
    <RelationField
      id={id}
      resource={field.resource ?? ''}
      value={asText(value)}
      onChange={onChange}
    />
  ),
  relations: ({ field, value, onChange }) => (
    <RelationsField
      resource={field.resource ?? ''}
      value={asList<string>(value)}
      onChange={onChange}
    />
  ),
  multiselect: ({ field, value, onChange }) => (
    <ChipToggleGroup
      choices={(field.options ?? []).map((option) => ({ id: option.value, name: option.label }))}
      value={asList<string>(value)}
      onChange={onChange}
    />
  ),
  custom: ({ field, value, onChange }) => field.render?.({ value, onChange }),
  repeater: ({ field, value, onChange }) => (
    <RepeaterField
      itemFields={field.itemFields ?? []}
      value={asList<Record<string, string>>(value)}
      onChange={onChange}
      addLabel={field.placeholder ?? 'Add item'}
    />
  ),
  richtext: ({ value, onChange }) => (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-raised" />}>
      <RichTextField value={asText(value)} onChange={onChange} />
    </Suspense>
  ),
};

/** Types that always span both columns of the form grid. */
const ALWAYS_WIDE = new Set<FieldConfig['type']>([
  'richtext',
  'images',
  'relations',
  'repeater',
  'multiselect',
  'custom',
]);

interface FormFieldProps {
  field: FieldConfig;
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  error?: string;
}

/** Renders the right control for a field config, with its label, help text and error. */
export function FormField({ field, register, control, error }: FormFieldProps) {
  const id = `field-${field.name}`;
  const rules = { required: field.required ? `${field.label} is required` : false };
  const shared = { id, placeholder: field.placeholder, 'aria-invalid': Boolean(error) };
  const Custom = CUSTOM_CONTROLS[field.type];

  const renderControl = () => {
    if (Custom) {
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: input }) => (
            <>{Custom({ id, field, value: input.value, onChange: input.onChange })}</>
          )}
        />
      );
    }
    if (field.type === 'textarea') return <Textarea {...shared} {...register(field.name, rules)} />;
    if (field.type === 'select') {
      return (
        <Select
          {...shared}
          options={field.options ?? []}
          placeholder={field.required ? undefined : 'None'}
          {...register(field.name, rules)}
        />
      );
    }
    return (
      <Input
        {...shared}
        type={field.type === 'datetime' ? 'datetime-local' : field.type}
        min={field.min}
        max={field.max}
        step={field.type === 'number' ? 'any' : undefined}
        {...register(field.name, rules)}
      />
    );
  };

  const isSwitch = field.type === 'switch';
  const isWide = field.wide || ALWAYS_WIDE.has(field.type);

  return (
    <div
      className={cn(
        isWide && 'sm:col-span-2',
        isSwitch && 'flex items-center justify-between gap-4',
      )}
    >
      <label htmlFor={id} className={cn('block font-medium', !isSwitch && 'mb-1.5')}>
        {field.label}
        {field.required && <span className="ml-0.5 text-danger">*</span>}
        {isSwitch && field.help && (
          <span className="block text-xs font-normal text-muted">{field.help}</span>
        )}
      </label>
      {renderControl()}
      {!isSwitch && field.help && !error && <p className="mt-1 text-xs text-muted">{field.help}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
