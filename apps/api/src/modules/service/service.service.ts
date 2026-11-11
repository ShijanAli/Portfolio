import type { Service } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { createSeo, upsertSeo } from '@/common/utils/relations';
import { prisma } from '@/lib/prisma';
import type { CreateServiceInput, UpdateServiceInput } from './service.schema';

type FaqInput = CreateServiceInput['faqs'];

const orderedFaqs = (faqs: FaqInput) => faqs.map((faq, order) => ({ ...faq, order }));

class ServiceService extends BaseService<Service, CreateServiceInput, UpdateServiceInput> {
  constructor() {
    super(prisma.service, {
      resource: 'Service',
      slugFrom: 'title',
      include: { faqs: { orderBy: { order: 'asc' } }, seo: true },
      listOmit: { content: true },
      searchFields: ['title', 'shortDesc'],
      filterFields: ['status'],
      sortFields: ['title', 'order', 'createdAt'],
      defaultSort: { field: 'order', order: 'asc' },
    });
  }

  protected override async prepareCreate({ faqs, seo, ...data }: CreateServiceInput) {
    return { ...data, faqs: { create: orderedFaqs(faqs) }, seo: createSeo(seo) };
  }

  protected override async prepareUpdate({ faqs, seo, ...data }: UpdateServiceInput) {
    return {
      ...data,
      // The FAQ list is replaced as a whole when the client sends one.
      faqs: faqs ? { deleteMany: {}, create: orderedFaqs(faqs) } : undefined,
      seo: upsertSeo(seo),
    };
  }
}

export const serviceService = new ServiceService();
