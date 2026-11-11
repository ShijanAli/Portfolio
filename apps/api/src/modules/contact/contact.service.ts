import type { ContactMessage } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { contactNoticeEmail } from '@/emails/contact.emails';
import { sendEmailInBackground } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import type { SubmitContactInput, UpdateContactInput } from './contact.schema';

type ContactData = Omit<SubmitContactInput, 'website'>;

class ContactService extends BaseService<ContactMessage, ContactData, UpdateContactInput> {
  constructor() {
    super(prisma.contactMessage, {
      resource: 'Message',
      searchFields: ['name', 'email', 'subject', 'message'],
      filterFields: ['isRead'],
      sortFields: ['name', 'createdAt'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    });
  }

  protected override async prepareUpdate({ replied, ...data }: UpdateContactInput) {
    if (replied === undefined) return data;
    return { ...data, repliedAt: replied ? new Date() : null };
  }

  /** Stores a message from the website and notifies the site owner. */
  async submit({ website: _website, ...data }: SubmitContactInput): Promise<void> {
    const message = await this.create(data);
    const notice = contactNoticeEmail(message);
    if (notice) sendEmailInBackground(notice);
  }

  countUnread() {
    return prisma.contactMessage.count({ where: { isRead: false } });
  }
}

export const contactService = new ContactService();
