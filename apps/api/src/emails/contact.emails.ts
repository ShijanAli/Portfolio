import type { ContactMessage } from '@prisma/client';
import { env } from '@/config/env';
import type { EmailMessage } from '@/lib/mailer';
import { detailList, renderLayout } from './layout';

/** Returns null when no notification address is configured. */
export function contactNoticeEmail(message: ContactMessage): EmailMessage | null {
  if (!env.ADMIN_NOTIFY_EMAIL) return null;

  return {
    to: { email: env.ADMIN_NOTIFY_EMAIL },
    replyTo: { email: message.email, name: message.name },
    subject: `New message from ${message.name}`,
    html: renderLayout({
      heading: 'New contact message',
      body: detailList([
        ['From', `${message.name} <${message.email}>`],
        ['Subject', message.subject],
        ['Message', message.message],
      ]),
    }),
  };
}
