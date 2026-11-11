import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageSpinner } from '@/components/ui/feedback';
import { refreshSession } from '@/lib/api';
import { useSession } from '@/lib/session';

/** Guards the admin: restores the session after a page load, or sends the user to log in. */
export function RequireAuth() {
  const status = useSession((state) => state.status);
  const location = useLocation();

  useEffect(() => {
    if (status === 'loading') void refreshSession();
  }, [status]);

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
