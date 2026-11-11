import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from '@/app/router';
import { ConfirmProvider } from '@/components/modal/ConfirmProvider';
import { queryClient } from '@/lib/query-client';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  </StrictMode>,
);
