import type { Campaign, Subscriber } from '@prisma/client';
import { API_PREFIX } from '@/config/constants';
import { env } from '@/config/env';
import type { EmailMessage } from '@/lib/mailer';
import { paragraph, renderLayout } from './layout';

type Recipient = Pick<Subscriber, 'email' | 'name' | 'unsubscribeToken'>;

const recipientOf = ({ email, name }: Recipient) => ({ email, name: name ?? undefined });
const greeting = (subscriber: Recipient) =>
  paragraph(subscriber.name ? `Hi ${subscriber.name},` : 'Hi,');

const pageUrl = (page: string, token: string) =>
  `${env.WEB_URL}/newsletter/${page}?token=${encodeURIComponent(token)}`;

/**
 * Lets mail clients show a native "Unsubscribe" button that works with one click
 * (RFC 8058). Gmail and Yahoo require it for bulk mail.
 */
const unsubscribeHeaders = (token: string) => ({
  'List-Unsubscribe': `<${env.API_PUBLIC_URL}${API_PREFIX}/newsletter/unsubscribe?token=${encodeURIComponent(token)}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
});

const unsubscribeFooter = (token: string) =>
  `You are receiving this because you subscribed to the newsletter.<br>
   <a href="${pageUrl('preferences', token)}" style="color:#7b8194">Preferences</a> ·
   <a href="${pageUrl('unsubscribe', token)}" style="color:#7b8194">Unsubscribe</a>`;

export function confirmSubscriptionEmail(
  subscriber: Recipient,
  confirmToken: string,
): EmailMessage {
  return {
    to: recipientOf(subscriber),
    subject: 'Please confirm your subscription',
    html: renderLayout({
      heading: 'Confirm your subscription',
      body:
        greeting(subscriber) +
        paragraph('Please confirm that you want to receive the newsletter.') +
        paragraph('If you did not ask for this, you can ignore this email.'),
      cta: { label: 'Confirm subscription', url: pageUrl('confirm', confirmToken) },
    }),
  };
}

export function welcomeEmail(subscriber: Recipient): EmailMessage {
  return {
    to: recipientOf(subscriber),
    subject: 'You are subscribed',
    headers: unsubscribeHeaders(subscriber.unsubscribeToken),
    html: renderLayout({
      heading: 'Welcome aboard',
      body:
        greeting(subscriber) +
        paragraph('Thanks for subscribing. New posts and updates will land here.'),
      footer: unsubscribeFooter(subscriber.unsubscribeToken),
    }),
  };
}

/** `campaign.content` is sanitized rich text, so it is inserted as HTML. */
export function campaignEmail(
  campaign: Pick<Campaign, 'subject' | 'preheader' | 'content'>,
  subscriber: Recipient,
): EmailMessage {
  const preheader = campaign.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden">${paragraph(campaign.preheader)}</div>`
    : '';

  return {
    to: recipientOf(subscriber),
    subject: campaign.subject,
    headers: unsubscribeHeaders(subscriber.unsubscribeToken),
    html: renderLayout({
      heading: campaign.subject,
      body: preheader + campaign.content,
      footer: unsubscribeFooter(subscriber.unsubscribeToken),
    }),
  };
}
