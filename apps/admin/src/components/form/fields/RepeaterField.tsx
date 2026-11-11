import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/inputs';
import type { FieldConfig } from '../types';

type Item = Record<string, string>;

interface RepeaterFieldProps {
  itemFields: NonNullable<FieldConfig['itemFields']>;
  value: Item[];
  onChange: (value: Item[]) => void;
  addLabel: string;
}

/** An ordered list of small records, e.g. FAQ entries. Array order is display order. */
export function RepeaterField({ itemFields, value, onChange, addLabel }: RepeaterFieldProps) {
  const update = (index: number, name: string, text: string) =>
    onChange(
      value.map((item, position) => (position === index ? { ...item, [name]: text } : item)),
    );

  const move = (index: number, offset: -1 | 1) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + offset, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <div key={index} className="rounded-lg border border-border bg-bg p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted">#{index + 1}</span>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Move down"
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() => onChange(value.filter((_, position) => position !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {itemFields.map(({ name, label, multiline }) => {
              const Control = multiline ? Textarea : Input;
              return (
                <Control
                  key={name}
                  aria-label={`${label} ${index + 1}`}
                  placeholder={label}
                  value={item[name] ?? ''}
                  onChange={(event) => update(index, name, event.target.value)}
                />
              );
            })}
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          onChange([...value, Object.fromEntries(itemFields.map(({ name }) => [name, '']))])
        }
      >
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
