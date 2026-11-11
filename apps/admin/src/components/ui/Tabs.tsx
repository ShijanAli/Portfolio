import { cn } from '@/lib/cn';

interface TabsProps {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  label: string;
}

export function Tabs({ tabs, active, onChange, label }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === active}
          onClick={() => onChange(tab.key)}
          className={cn(
            '-mb-px cursor-pointer border-b-2 px-3 py-2 whitespace-nowrap transition-colors',
            tab.key === active
              ? 'border-accent font-medium text-fg'
              : 'border-transparent text-muted hover:text-fg',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
