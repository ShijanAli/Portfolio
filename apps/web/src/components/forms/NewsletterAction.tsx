'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { describeError, sendToApi } from './useApiForm';

const ACTIONS = {
  confirm: {
    path: '/newsletter/confirm',
    question: 'Confirm that you want to receive the newsletter.',
    button: 'Confirm subscription',
    done: 'You are subscribed. Welcome aboard!',
  },
  unsubscribe: {
    path: '/newsletter/unsubscribe',
    question: 'You will stop receiving all newsletter emails.',
    button: 'Unsubscribe',
    done: 'You have been unsubscribed. Sorry to see you go.',
  },
} as const;

/**
 * Confirm or unsubscribe with the token from an email link. It takes a click on purpose:
 * mail scanners open links automatically, and must not be able to (un)subscribe anyone.
 */
export function NewsletterAction({
  action,
  token,
}: {
  action: keyof typeof ACTIONS;
  token?: string;
}) {
  const [state, setState] = useState<{
    status: 'idle' | 'busy' | 'done' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: '',
  });
  const config = ACTIONS[action];

  if (!token) {
    return (
      <Card className="p-8">
        <p role="alert">This link is incomplete. Please use the link from your email again.</p>
      </Card>
    );
  }

  const run = async () => {
    setState({ status: 'busy', message: '' });
    try {
      await sendToApi(config.path, { token });
      setState({ status: 'done', message: config.done });
    } catch (error) {
      setState({ status: 'error', message: describeError(error) });
    }
  };

  return (
    <Card className="p-8">
      {state.status === 'done' ? (
        <>
          <p role="status" className="text-xl">
            {state.message}
          </p>
          <ButtonLink href="/" variant="secondary" className="mt-6">
            Back to the site
          </ButtonLink>
        </>
      ) : (
        <>
          <p className="text-lg">{config.question}</p>
          <Button
            size="lg"
            className="mt-6"
            disabled={state.status === 'busy'}
            onClick={() => void run()}
          >
            {state.status === 'busy' ? 'One moment...' : config.button}
          </Button>
          {state.status === 'error' && (
            <p role="alert" className="mt-4 text-danger">
              {state.message}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
