'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { describeError, sendToApi } from './useApiForm';

const TOPICS = [
  { value: 'blog', label: 'New articles' },
  { value: 'projects', label: 'New projects and case studies' },
  { value: 'offers', label: 'Service updates and offers' },
];

interface Preferences {
  email: string;
  topics: string[];
  status: string;
}

/** Lets a subscriber choose which kinds of email they receive. */
export function NewsletterPreferences({ token }: { token?: string }) {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    sendToApi<Preferences>(
      `/newsletter/preferences?token=${encodeURIComponent(token)}`,
      undefined,
      'GET',
    )
      .then((result) => setPreferences(result.data))
      .catch((error: unknown) => setMessage(describeError(error)));
  }, [token]);

  if (!token || (!preferences && message)) {
    return (
      <Card className="p-8">
        <p role="alert">
          {message || 'This link is incomplete. Please use the link from your email again.'}
        </p>
      </Card>
    );
  }
  if (!preferences) {
    return (
      <Card className="p-8">
        <p className="animate-pulse text-muted">Loading your preferences...</p>
      </Card>
    );
  }

  const toggle = (topic: string) =>
    setPreferences({
      ...preferences,
      topics: preferences.topics.includes(topic)
        ? preferences.topics.filter((other) => other !== topic)
        : [...preferences.topics, topic],
    });

  const save = async () => {
    setSaving(true);
    try {
      const result = await sendToApi<Preferences>(
        '/newsletter/preferences',
        { token, topics: preferences.topics },
        'PUT',
      );
      setPreferences(result.data);
      setMessage('Your preferences are saved.');
    } catch (error) {
      setMessage(describeError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-8">
      <p className="text-muted">
        Emails are sent to <span className="text-fg">{preferences.email}</span>.
      </p>
      <fieldset className="mt-6">
        <legend className="mb-3 text-lg font-medium">Send me</legend>
        <div className="space-y-3">
          {TOPICS.map((topic) => (
            <label key={topic.value} className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="size-5 cursor-pointer accent-accent"
                checked={preferences.topics.includes(topic.value)}
                onChange={() => toggle(topic.value)}
              />
              {topic.label}
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Leave everything unticked to receive all emails.</p>
      </fieldset>
      <Button size="lg" className="mt-6" disabled={saving} onClick={() => void save()}>
        {saving ? 'Saving...' : 'Save preferences'}
      </Button>
      {message && (
        <p role="status" className="mt-4">
          {message}
        </p>
      )}
    </Card>
  );
}
