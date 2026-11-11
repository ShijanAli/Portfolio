import { isApiError } from '@portfolio/api-client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/errors';
import { FormField } from './FormField';
import type { FieldConfig, FormValues } from './types';
import { getPath, groupBySection, toFormValues, toPayload } from './values';

interface ResourceFormProps {
  fields: FieldConfig[];
  /** The record being edited. Omit to create. */
  record?: object;
  onSubmit: (payload: Record<string, unknown>) => Promise<unknown>;
  /** Omit for forms that are a page of their own, with nothing to go back to. */
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * A form generated from field configs. The API is the single source of validation rules:
 * its per-field errors are shown under the matching inputs, so no rule is written twice.
 */
export function ResourceForm({
  fields,
  record,
  onSubmit,
  onCancel,
  submitLabel,
}: ResourceFormProps) {
  const mode = record ? 'edit' : 'create';
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: toFormValues(fields, record) });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toPayload(fields, values, mode));
    } catch (error) {
      const known = new Set(fields.map((field) => field.name));
      const fieldErrors = isApiError(error) ? Object.entries(error.fields) : [];
      const shown = fieldErrors.filter(([name]) => known.has(name));

      shown.forEach(([name, message]) => setError(name, { message }));
      // Anything that cannot be attached to a visible field is shown as a toast.
      if (shown.length === 0 || shown.length < fieldErrors.length) toast.error(errorMessage(error));
    }
  });

  const sections = groupBySection(fields);
  const errorOf = (field: FieldConfig) => {
    const message = (getPath(errors, field.name) as { message?: unknown } | undefined)?.message;
    return typeof message === 'string' ? message : undefined;
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-6">
        {sections.map((section, index) => (
          <section
            key={section.title ?? index}
            className={cn(index > 0 && 'border-t border-border pt-6')}
          >
            {section.title && <h2 className="mb-4 text-base font-semibold">{section.title}</h2>}
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  register={register}
                  control={control}
                  error={errorOf(field)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel ?? (mode === 'edit' ? 'Save changes' : 'Create')}
        </Button>
      </div>
    </form>
  );
}
