import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import { NAVIGATION } from './navigation';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <p className="px-3 text-base font-semibold tracking-tight">
        Portfolio <span className="text-accent-text">Admin</span>
      </p>

      {NAVIGATION.map((group, index) => (
        <div key={group.title ?? index}>
          {group.title && (
            <p className="mb-1.5 px-3 text-xs font-medium tracking-wider text-muted/70 uppercase">
              {group.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted transition-colors hover:bg-raised hover:text-fg',
                      isActive && 'bg-accent/15 font-medium text-fg',
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
