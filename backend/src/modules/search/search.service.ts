import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { PostStatus, Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchPosts(q: string, page: number, limit: number) {
  q = q.trim();
  if (q.length < 2) return { items: [], total: 0, page, limit };
  const skip = (page - 1) * limit;
    const where: Prisma.PostWhereInput = {
      status: PostStatus.PUBLISHED,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
      ],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          readingTime: true,
          publishedAt: true,
          author: { select: { id: true, name: true } },
          categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const normalized = items.map((p) => ({
      ...p,
      categories: p.categories.map((c: { category: { id: string; name: string; slug: string } }) => c.category),
    }));
    return { items: normalized, total, page, limit };
  }

  async suggest(q: string, limit: number) {
  q = q.trim();
  if (q.length < 2) return { titles: [], tags: [] };
  // Simple suggestions a partir de coincidencias de título (y tags)
    const titles = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        title: { contains: q, mode: 'insensitive' },
      },
      select: { title: true },
      take: limit,
    });

    const tags = await this.prisma.tag.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { name: true, slug: true },
      take: limit,
    });

    return {
      titles: titles.map((t) => t.title),
      tags,
    };
  }
}
