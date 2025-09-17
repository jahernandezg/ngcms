import { Injectable } from '@nestjs/common';
import { calcReadingTime } from '@cms-workspace/utils';
import { PrismaService } from '@cms-workspace/database';
import { PostStatus } from '@prisma/client';

export const DEFAULT_POSTS_CACHE_TTL_MS = 30_000; // 30s por defecto

interface CacheEntry<T> { expires: number; value: T }

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private postsCacheTtlMs = (() => {
    const raw = process.env.POSTS_CACHE_TTL_MS;
    if (!raw) return DEFAULT_POSTS_CACHE_TTL_MS;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_POSTS_CACHE_TTL_MS;
  })();

  // Caché simple en memoria (proceso) - válido para despliegues single instance o como capa L1
  private cache = new Map<string, CacheEntry<unknown>>();

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private setCache<T>(key: string, value: T, ttlMs = this.postsCacheTtlMs) {
    this.cache.set(key, { value, expires: Date.now() + ttlMs });
  }

  async findPublishedPaginated(page: number, limit: number, opts?: { skipCache?: boolean }) {
    const key = `findPublishedPaginated:${page}:${limit}`;
    if (!opts?.skipCache) {
      const cached = this.getFromCache<ReturnType<typeof Object>>(key);
      if (cached) return cached;
    }
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          readingTime: true,
          publishedAt: true,
          author: { select: { id: true, name: true } },
          categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
          tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        },
      }),
  this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    ]);

    // map categories and tags relations to flat arrays
    const normalized = items.map((p) => ({
      ...p,
      categories: (p.categories ?? []).map((c) => c.category),
      tags: (p.tags ?? []).map((t) => t.tag),
    }));
  const result = { items: normalized, total, page, limit };
  if (!opts?.skipCache) this.setCache(key, result);
  return result;
  }

  async findPublishedByAuthorPaginated(authorSlug: string, page: number, limit: number) {
    const key = `findPublishedByAuthorPaginated:${authorSlug}:${page}:${limit}`;
    const cached = this.getFromCache<ReturnType<typeof Object>>(key);
    if (cached) return cached;
    const author = await this.prisma.user.findUnique({ where: { slug: authorSlug }, select: { id: true, slug: true, name: true } });
    if (!author) return { items: [], total: 0, page, limit };
    const skip = (page - 1) * limit;
    const where = { status: PostStatus.PUBLISHED, authorId: author.id } as const;
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
          readingTime: true,
          publishedAt: true,
          author: { select: { id: true, name: true, slug: true } },
          categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
          tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);
    const normalized = items.map((p) => ({
      ...p,
      categories: (p.categories ?? []).map((c) => c.category),
      tags: (p.tags ?? []).map((t) => t.tag),
    }));
    const result = { items: normalized, total, page, limit };
    this.setCache(key, result);
    return result;
  }

  private async getCategoryAndDescendantsIdsBySlug(slug: string): Promise<string[]> {
    const root = await this.prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (!root) return [];
    const ids: string[] = [root.id];
    let frontier: string[] = [root.id];
    // BFS over children
    while (frontier.length) {
      const children = await this.prisma.category.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true },
      });
      const newIds = children.map((c) => c.id).filter((id) => !ids.includes(id));
      if (newIds.length === 0) break;
      ids.push(...newIds);
      frontier = newIds;
    }
    return ids;
  }

  async findPublishedByCategorySlugPaginated(slug: string, page: number, limit: number) {
    const key = `findPublishedByCategorySlugPaginated:${slug}:${page}:${limit}`;
    const cached = this.getFromCache<ReturnType<typeof Object>>(key);
    if (cached) return cached;
    const catIds = await this.getCategoryAndDescendantsIdsBySlug(slug);
    if (catIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: {
          status: PostStatus.PUBLISHED,
          categories: { some: { categoryId: { in: catIds } } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          readingTime: true,
          publishedAt: true,
          author: { select: { id: true, name: true } },
          categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
          tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      this.prisma.post.count({
        where: {
          status: PostStatus.PUBLISHED,
          categories: { some: { categoryId: { in: catIds } } },
        },
      }),
    ]);

    const normalized = items.map((p) => ({
      ...p,
      categories: (p.categories ?? []).map((c) => c.category),
      tags: (p.tags ?? []).map((t) => t.tag),
    }));
  const result = { items: normalized, total, page, limit };
  this.setCache(key, result);
  return result;
  }

  async findPublishedByTagSlugPaginated(slug: string, page: number, limit: number) {
    const key = `findPublishedByTagSlugPaginated:${slug}:${page}:${limit}`;
    const cached = this.getFromCache<ReturnType<typeof Object>>(key);
    if (cached) return cached;
    const tag = await this.prisma.tag.findUnique({ where: { slug }, select: { id: true } });
    if (!tag) return { items: [], total: 0, page, limit };
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: {
          status: PostStatus.PUBLISHED,
          tags: { some: { tagId: tag.id } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          readingTime: true,
          publishedAt: true,
          author: { select: { id: true, name: true } },
          categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
          tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      this.prisma.post.count({
        where: { status: PostStatus.PUBLISHED, tags: { some: { tagId: tag.id } } },
      }),
    ]);
    const normalized = items.map((p) => ({
      ...p,
      categories: (p.categories ?? []).map((c) => c.category),
      tags: (p.tags ?? []).map((t) => t.tag),
    }));
  const result = { items: normalized, total, page, limit };
  this.setCache(key, result);
  return result;
  }

  async findRelatedPostsBySlug(slug: string, limit = 5) {
    const key = `findRelatedPostsBySlug:${slug}:${limit}`;
  const cached = this.getFromCache<unknown[]>(key) as { id: string }[] | null;
    if (cached) return cached;
    const base = await this.prisma.post.findUnique({
      where: { slug },
      select: {
        id: true,
        categories: { select: { categoryId: true } },
        tags: { select: { tagId: true } },
      },
    });
    if (!base) return [];
  const catIds = (base.categories ?? []).map((c) => c.categoryId);
  const tagIds = (base.tags ?? []).map((t) => t.tagId);

    const candidates = await this.prisma.post.findMany({
      where: {
        id: { not: base.id },
        status: PostStatus.PUBLISHED,
        OR: [
          { categories: { some: { categoryId: { in: catIds } } } },
          { tags: { some: { tagId: { in: tagIds } } } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        readingTime: true,
        publishedAt: true,
        author: { select: { id: true, name: true } },
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    // Rank by number of shared tags/categories
    const scored = candidates.map((p) => {
      const pCatIds = (p.categories ?? []).map((c) => c.category.id);
      const pTagIds = (p.tags ?? []).map((t) => t.tag.id);
      const sharedCats = pCatIds.filter((id) => catIds.includes(id)).length;
      const sharedTags = pTagIds.filter((id) => tagIds.includes(id)).length;
      const score = sharedCats * 2 + sharedTags; // weight categories a bit higher
      return {
        ...p,
        categories: (p.categories ?? []).map((c) => c.category),
        tags: (p.tags ?? []).map((t) => t.tag),
        score,
      };
    });

  const result = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        readingTime: p.readingTime,
        publishedAt: p.publishedAt,
        author: p.author,
        categories: p.categories,
        tags: p.tags,
      }));
  this.setCache(key, result);
  return result;
  }

  async findPublishedBySlugAndIncrement(slug: string) {
    // Incrementa viewCount y devuelve el post si es PUBLISHED
  const updated = await this.prisma.post.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        readingTime: true,
        publishedAt: true,
        viewCount: true,
        author: { select: { id: true, name: true, avatarUrl: true, bio: true } },
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        status: true,
      },
    });

    if (updated.status !== PostStatus.PUBLISHED) return null;

    // Normaliza categorías/tags
  const categories = (updated.categories ?? []).map((c) => c.category);
  const tags = (updated.tags ?? []).map((t) => t.tag);
  const result = {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      excerpt: updated.excerpt,
      content: updated.content,
      readingTime: updated.readingTime || calcReadingTime(updated.content || ''),
      publishedAt: updated.publishedAt,
      viewCount: updated.viewCount,
      author: updated.author,
      categories,
      tags,
    };
  // Invalida cachés relacionadas (simple: limpiar todo; poco costo por tamaño pequeño)
  this.cache.clear();
  return result;
  }
}
