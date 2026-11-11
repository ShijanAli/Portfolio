import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { humanize } from '@/lib/format';

interface Section {
  key: string;
  enabled: boolean;
}

/** camelCase key -> label, e.g. "techStack" -> "Tech stack". */
const labelOf = (key: string) => humanize(key.replace(/([A-Z])/g, '_$1'));

/** Order and visibility of the home page sections. */
export function SectionsEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: Section[]) => void;
}) {
  const sections = Array.isArray(value) ? (value as Section[]) : [];

  const move = (index: number, offset: -1 | 1) => {
    const next = [...sections];
    const [section] = next.splice(index, 1);
    if (section) next.splice(index + offset, 0, section);
    onChange(next);
  };

  const toggle = (index: number, enabled: boolean) =>
    onChange(
      sections.map((section, position) => (position === index ? { ...section, enabled } : section)),
    );

  return (
    <ol className="divide-y divide-border rounded-lg border border-border">
      {sections.map((section, index) => (
        <li key={section.key} className="flex items-center gap-3 px-3 py-2">
          <span className="w-5 text-xs text-muted">{index + 1}</span>
          <span className={section.enabled ? 'flex-1' : 'flex-1 text-muted line-through'}>
            {labelOf(section.key)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Move ${labelOf(section.key)} up`}
            disabled={index === 0}
            onClick={() => move(index, -1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Move ${labelOf(section.key)} down`}
            disabled={index === sections.length - 1}
            onClick={() => move(index, 1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Switch
            aria-label={`Show ${labelOf(section.key)}`}
            checked={section.enabled}
            onChange={(enabled) => toggle(index, enabled)}
          />
        </li>
      ))}
    </ol>
  );
}
