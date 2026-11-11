import type { Subscriber, SubscriberStatus } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { toCsv } from '@/common/utils/csv';
import { prisma } from '@/lib/prisma';
import type { UpdateSubscriberInput } from './subscriber.schema';

const STATUSES: SubscriberStatus[] = ['PENDING', 'CONFIRMED', 'UNSUBSCRIBED', 'BOUNCED'];

class SubscriberService extends BaseService<Subscriber, never, UpdateSubscriberInput> {
  constructor() {
    super(prisma.subscriber, {
      resource: 'Subscriber',
      // Tokens authorize confirm/unsubscribe, so they are never sent to the admin panel.
      omit: { confirmToken: true, unsubscribeToken: true },
      searchFields: ['email', 'name'],
      filterFields: ['status', 'source'],
      sortFields: ['email', 'status', 'confirmedAt', 'createdAt'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    });
  }

  protected override async prepareUpdate(input: UpdateSubscriberInput) {
    return input.status === 'UNSUBSCRIBED' ? { ...input, unsubscribedAt: new Date() } : input;
  }

  /** Count per status, including statuses with no subscribers. */
  async getStats(): Promise<Record<SubscriberStatus, number> & { total: number }> {
    const groups = await prisma.subscriber.groupBy({ by: ['status'], _count: true });
    const counts = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<
      SubscriberStatus,
      number
    >;
    for (const group of groups) counts[group.status] = group._count;
    return { ...counts, total: groups.reduce((sum, group) => sum + group._count, 0) };
  }

  async exportCsv(): Promise<string> {
    const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: 'asc' } });
    return toCsv(
      ['email', 'name', 'status', 'source', 'topics', 'subscribedAt', 'confirmedAt'],
      subscribers.map((subscriber) => [
        subscriber.email,
        subscriber.name,
        subscriber.status,
        subscriber.source,
        subscriber.topics.join(' '),
        subscriber.createdAt,
        subscriber.confirmedAt,
      ]),
    );
  }
}

export const subscriberService = new SubscriberService();
