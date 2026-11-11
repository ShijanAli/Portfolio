import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ResourceForm } from '@/components/form/ResourceForm';
import type { FieldConfig } from '@/components/form/types';
import { ErrorState, Skeleton } from '@/components/ui/feedback';

interface SettingsFormProps {
  /** Cache key of the document this form edits. */
  queryKey: readonly unknown[];
  load: () => Promise<object>;
  save: (body: Record<string, unknown>) => Promise<unknown>;
  fields: FieldConfig[];
}

/**
 * Edits one settings document: loads it, shows the common form, saves the whole document
 * back. Site settings, booking settings and page SEO are all this component.
 */
export function SettingsForm({ queryKey, load, save, fields }: SettingsFormProps) {
  const queryClient = useQueryClient();
  const { data, error, refetch, dataUpdatedAt } = useQuery({
    queryKey,
    queryFn: load,
    staleTime: 0,
  });

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data) return <Skeleton className="h-64 w-full" />;

  return (
    <ResourceForm
      // Rebuilt after each save, so the form always starts from what is stored.
      key={dataUpdatedAt}
      fields={fields}
      record={data}
      submitLabel="Save"
      onSubmit={async (body) => {
        await save(body);
        toast.success('Saved');
        await queryClient.invalidateQueries({ queryKey });
      }}
    />
  );
}
