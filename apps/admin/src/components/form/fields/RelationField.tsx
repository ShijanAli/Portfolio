import { useQuery } from '@tanstack/react-query';
import { Select } from '@/components/ui/inputs';
import { api } from '@/lib/api';
import { ChipToggleGroup } from './ChipToggleGroup';

interface Choice {
  id: string;
  name: string;
}

/** Choices for a relation, loaded from another resource, e.g. all tags. */
function useChoices(resource: string) {
  return useQuery({
    queryKey: [resource, 'choices'],
    queryFn: async () =>
      (await api.resource<Choice>(resource).list({ limit: 100, sort: 'name', order: 'asc' })).items,
  });
}

interface RelationFieldProps {
  id?: string;
  resource: string;
  value: string;
  onChange: (value: string) => void;
}

/** Pick one related record. */
export function RelationField({ id, resource, value, onChange }: RelationFieldProps) {
  const { data = [] } = useChoices(resource);

  return (
    <Select
      id={id}
      placeholder="None"
      options={data.map((choice) => ({ value: choice.id, label: choice.name }))}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface RelationsFieldProps {
  resource: string;
  value: string[];
  onChange: (value: string[]) => void;
}

/** Pick any number of related records, shown as toggle chips. */
export function RelationsField({ resource, value, onChange }: RelationsFieldProps) {
  const { data = [], isLoading } = useChoices(resource);

  if (isLoading) return <p className="text-muted">Loading...</p>;
  if (data.length === 0) return <p className="text-muted">Nothing to choose from yet.</p>;

  return <ChipToggleGroup choices={data} value={value} onChange={onChange} />;
}
