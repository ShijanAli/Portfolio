import type { BlogCategory } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type { CreateBlogCategoryInput, UpdateBlogCategoryInput } from './blog-category.schema';

export const blogCategoryService = new BaseService<
  BlogCategory,
  CreateBlogCategoryInput,
  UpdateBlogCategoryInput
>(prisma.blogCategory, {
  resource: 'Blog category',
  slugFrom: 'name',
  include: { _count: { select: { posts: true } } },
  searchFields: ['name'],
  sortFields: ['name', 'order', 'createdAt'],
  defaultSort: { field: 'order', order: 'asc' },
});
