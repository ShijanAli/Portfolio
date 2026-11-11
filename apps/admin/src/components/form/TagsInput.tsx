import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/inputs';

interface TagsInputProps {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

/** A list of short strings. Enter or comma adds one; Backspace on an empty box removes the last. */
export function TagsInput({ id, value, onChange, placeholder }: TagsInputProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const next = draft.trim();
    if (next && !value.includes(next)) onChange([...value, next]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add();
    } else if (event.key === 'Backspace' && !draft) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <li
              key={item}
              className="flex items-center gap-1 rounded-md border border-border bg-raised py-0.5 pr-1 pl-2 text-xs"
            >
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(value.filter((other) => other !== item))}
                className="cursor-pointer rounded p-0.5 text-muted hover:text-fg"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        value={draft}
        placeholder={placeholder ?? 'Type and press Enter'}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
      />
    </div>
  );
}
