import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from './Modal';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * Lets any component ask "are you sure?" with one awaited call:
 * `if (await confirm({ title: 'Delete tag?' })) ...`
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(confirmed: boolean) => void>(undefined);

  const confirm = useCallback<Confirm>((next) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (confirmed: boolean) => {
    resolver.current?.(confirmed);
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={() => settle(false)}
        title={options?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              Cancel
            </Button>
            <Button
              variant={options?.danger ? 'danger' : 'primary'}
              onClick={() => settle(true)}
              autoFocus
            >
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        <p className="text-muted">{options?.description ?? 'This action cannot be undone.'}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}
