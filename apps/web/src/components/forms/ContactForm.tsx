'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import { FormMessage, Honeypot, TextAreaField, TextField } from './fields';
import { useApiForm } from './useApiForm';

export function ContactForm() {
  const form = useApiForm('/contact', {
    successMessage: 'Thanks for reaching out. I will get back to you soon.',
    onSuccess: () => trackEvent('contact_submitted'),
  });

  return (
    <form onSubmit={form.onSubmit} noValidate className="relative space-y-5">
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Your name"
          name="name"
          required
          autoComplete="name"
          error={form.fieldErrors.name}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          error={form.fieldErrors.email}
        />
      </div>
      <TextField label="Subject" name="subject" error={form.fieldErrors.subject} />
      <TextAreaField
        label="Tell me about your project"
        name="message"
        required
        error={form.fieldErrors.message}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Sending...' : 'Send message'}
          <Send className="size-4" aria-hidden />
        </Button>
        <FormMessage status={form.status} message={form.message} />
      </div>
    </form>
  );
}
