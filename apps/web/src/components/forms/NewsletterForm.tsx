'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { FormMessage, Honeypot, TextField } from './fields';
import { useApiForm } from './useApiForm';

interface NewsletterFormProps {
  /** Where the form is shown; stored with the subscription so sign-up sources can be compared. */
  source: 'section' | 'footer' | 'blog';
  className?: string;
}

/** The one newsletter sign-up form, used in the home section, the footer and under posts. */
export function NewsletterForm({ source, className }: NewsletterFormProps) {
  const form = useApiForm('/newsletter/subscribe', {
    successMessage: 'Almost done. Please check your inbox to confirm.',
    extra: { source },
    onSuccess: () => trackEvent('newsletter_subscribed', { source }),
  });

  return (
    <form onSubmit={form.onSubmit} noValidate className={cn('relative', className)}>
      <Honeypot />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <TextField
            label="Email address"
            hideLabel
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            error={form.fieldErrors.email}
          />
        </div>
        <Button type="submit" size="lg" className="h-12" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Subscribing...' : 'Subscribe'}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="mt-3 min-h-5">
        <FormMessage status={form.status} message={form.message} />
      </div>
    </form>
  );
}
