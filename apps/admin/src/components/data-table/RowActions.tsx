import * as Menu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { RowAction } from './types';

export function RowActions<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const visible = actions.filter((action) => !action.hidden?.(row));
  if (visible.length === 0) return null;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Row actions"
        className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-raised hover:text-fg"
      >
        <MoreHorizontal className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-40 rounded-lg border border-border bg-surface p-1 shadow-xl"
        >
          {visible.map(({ label, icon: Icon, onSelect, danger }) => (
            <Menu.Item
              key={label}
              onSelect={() => onSelect(row)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 outline-none data-highlighted:bg-raised',
                danger && 'text-danger',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
