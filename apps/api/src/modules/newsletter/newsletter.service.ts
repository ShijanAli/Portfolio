import type { Subscriber } from '@prisma/client';
import { ApiError } from '@/common/utils/api-error';
import { generateToken } from '@/common/utils/token';
import { confirmSubscriptionEmail, welcomeEmail } from '@/emails/newsletter.emails';
import { sendEmailInBackground } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import type { SubscribeInput, UpdatePreferencesInput } from './newsletter.schema';

const INVALID_LINK = 'This link is invalid or has already been used';

/** The visitor-facing newsletter flows. Admin management lives in the subscriber module. */
class NewsletterService {
  /**
   * Double opt-in: nobody is subscribed until they click the link in the confirmation
   * email. The caller always responds the same way, so the form cannot be used to find
   * out whether an address is already on the list.
   */
  async subscribe({ website: _website, email, ...details }: SubscribeInput): Promise<void> {
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing?.status === 'CONFIRMED') return;

    const confirmToken = generateToken(32);
    const subscriber = existing
      ? await prisma.subscriber.update({
          where: { id: existing.id },
          data: { ...details, status: 'PENDING', confirmToken, unsubscribedAt: null },
        })
      : await prisma.subscriber.create({
          data: { ...details, email, confirmToken, unsubscribeToken: generateToken(32) },
        });

    sendEmailInBackground(confirmSubscriptionEmail(subscriber, confirmToken));
  }

  async confirm(confirmToken: string): Promise<void> {
    const pending = await prisma.subscriber.findUnique({ where: { confirmToken } });
    if (!pending) throw ApiError.badRequest(INVALID_LINK);

    const subscriber = await prisma.subscriber.update({
      where: { id: pending.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmToken: null },
    });
    sendEmailInBackground(welcomeEmail(subscriber));
  }

  /** Safe to repeat: unsubscribing twice is still a success. */
  async unsubscribe(unsubscribeToken: string | undefined): Promise<void> {
    const subscriber = await this.findByToken(unsubscribeToken);
    if (subscriber.status === 'UNSUBSCRIBED') return;

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date(), confirmToken: null },
    });
  }

  async getPreferences(unsubscribeToken: string | undefined) {
    const { email, name, topics, status } = await this.findByToken(unsubscribeToken);
    return { email, name, topics, status };
  }

  async updatePreferences({ token, ...data }: UpdatePreferencesInput) {
    const subscriber = await this.findByToken(token);
    await prisma.subscriber.update({ where: { id: subscriber.id }, data });
    return this.getPreferences(token);
  }

  private async findByToken(unsubscribeToken: string | undefined): Promise<Subscriber> {
    const subscriber = unsubscribeToken
      ? await prisma.subscriber.findUnique({ where: { unsubscribeToken } })
      : null;
    if (!subscriber) throw ApiError.badRequest(INVALID_LINK);
    return subscriber;
  }
}

export const newsletterService = new NewsletterService();
