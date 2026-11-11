import { Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/inputs';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { FilterConfig } from './types';

interface ResourceToolbarProps {
  searchable: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filters: FilterConfig[];
  filterValues: Record<string, string>;
  onFilterChange: (name: string, value: string) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
}

export function ResourceToolbar({
  searchable,
  search,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  selectedCount,
  onDeleteSelected,
}: ResourceToolbarProps) {
  // Typing updates the box at once; the URL (and the request) follow after a pause.
  const [draft, setDraft] = useState(search);
  const debounced = useDebouncedValue(draft);

  useEffect(() => {
    if (debounced !== search) onSearchChange(debounced);
    // Only react to the debounced text; `search` and the callback change with every URL update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  if (!searchable && filters.length === 0 && selectedCount === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {searchable && (
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            aria-label="Search"
            placeholder="Search..."
            className="pl-9"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
      )}

      {filters.map((filter) => (
        <Select
          key={filter.name}
          aria-label={filter.label}
          className="w-auto"
          options={filter.options}
          placeholder={`${filter.label}: all`}
          value={filterValues[filter.name] ?? ''}
          onChange={(event) => onFilterChange(filter.name, event.target.value)}
        />
      ))}

      {selectedCount > 0 && (
        <Button variant="danger" size="sm" className="ml-auto" onClick={onDeleteSelected}>
          <Trash2 className="size-4" />
          Delete {selectedCount} selected
        </Button>
      )}
    </div>
  );
}
