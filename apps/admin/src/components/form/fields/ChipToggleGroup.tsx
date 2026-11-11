import { cn } from '@/lib/cn';

interface ChipToggleGroupProps {
  choices: { id: string; name: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}

/** Pick any number of choices, shown as toggle chips. */
export function ChipToggleGroup({ choices, value, onChange }: ChipToggleGroupProps) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((other) => other !== id) : [...value, id]);

  return (
    <ul className="flex flex-wrap gap-1.5">
      {choices.map((choice) => {
        const selected = value.includes(choice.id);
        return (
          <li key={choice.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(choice.id)}
              className={cn(
                'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors',
                selected
                  ? 'border-accent/50 bg-accent/15 text-fg'
                  : 'border-border bg-raised text-muted hover:text-fg',
              )}
            >
              {choice.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
