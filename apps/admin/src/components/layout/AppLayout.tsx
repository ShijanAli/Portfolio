import { LogOut, Menu, X } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Outlet } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/feedback';
import { logout } from '@/lib/api';
import { cn } from '@/lib/cn';
import { queryClient } from '@/lib/query-client';
import { useSession } from '@/lib/session';
import { Sidebar } from './Sidebar';

async function signOut() {
  await logout();
  // Nothing fetched for this user may be shown to the next one.
  queryClient.clear();
}

export function AppLayout() {
  const user = useSession((state) => state.user);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen lg:pl-60">
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 border-r border-border bg-surface transition-transform lg:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => void signOut()}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Screens loaded on demand show a spinner here while their code arrives. */}
        <Suspense fallback={<Spinner className="mx-auto mt-24 size-7" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
