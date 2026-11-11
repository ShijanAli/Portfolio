import type { Project } from '@prisma/client';
import { BaseService, type Where } from '@/common/base/base.service';
import type { ListQuery } from '@/common/utils/query-builder';
import { connectIds, createSeo, setIds, upsertSeo } from '@/common/utils/relations';
import { prisma } from '@/lib/prisma';
import type { CreateProjectInput, UpdateProjectInput } from './project.schema';

class ProjectService extends BaseService<Project, CreateProjectInput, UpdateProjectInput> {
  constructor() {
    super(prisma.project, {
      resource: 'Project',
      slugFrom: 'title',
      include: { category: true, technologies: true, seo: true },
      listOmit: { content: true },
      searchFields: ['title', 'summary', 'client'],
      filterFields: ['status', 'isFeatured'],
      sortFields: ['title', 'order', 'views', 'startDate', 'createdAt'],
      defaultSort: { field: 'order', order: 'asc' },
    });
  }

  protected override extraWhere(query: ListQuery): Where {
    const where: Where = {};
    if (typeof query.category === 'string') where.category = { slug: query.category };
    if (typeof query.technology === 'string') {
      where.technologies = { some: { slug: query.technology } };
    }
    return where;
  }

  protected override async prepareCreate({ technologyIds, seo, ...data }: CreateProjectInput) {
    return {
      ...data,
      technologies: { connect: connectIds(technologyIds) },
      seo: createSeo(seo),
    };
  }

  protected override async prepareUpdate({ technologyIds, seo, ...data }: UpdateProjectInput) {
    return { ...data, technologies: setIds(technologyIds), seo: upsertSeo(seo) };
  }
}

export const projectService = new ProjectService();
