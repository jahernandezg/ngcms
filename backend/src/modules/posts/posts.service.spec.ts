import { Test, TestingModule } from '@nestjs/testing';
import { PostsService, DEFAULT_POSTS_CACHE_TTL_MS } from './posts.service';
import { PrismaService } from '@cms-workspace/database';
import { PostStatus } from '@prisma/client';

interface PostDelegateMock {
  findMany: jest.Mock;
  count: jest.Mock;
  update: jest.Mock;
  findUnique: jest.Mock;
}
interface CategoryDelegateMock { findUnique: jest.Mock; findMany: jest.Mock }
interface TagDelegateMock { findUnique: jest.Mock }
interface UserDelegateMock { findUnique: jest.Mock }

describe('PostsService', () => {
  let service: PostsService;
  let prisma: { post: PostDelegateMock; category: CategoryDelegateMock; tag: TagDelegateMock; user: UserDelegateMock; $transaction: jest.Mock };

  beforeEach(async () => {
    prisma = {
      post: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
  tag: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
      $transaction: jest.fn(async (operations: unknown[]) => Promise.all(operations as Promise<unknown>[])),
  } as { post: PostDelegateMock; category: CategoryDelegateMock; tag: TagDelegateMock; user: UserDelegateMock; $transaction: jest.Mock };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PostsService);
  });

  it('findPublishedByCategorySlugPaginated returns empty when category not found', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    const res = await service.findPublishedByCategorySlugPaginated('unknown', 1, 10);
    expect(res.total).toBe(0);
    expect(res.items).toHaveLength(0);
  });

  it('findPublishedByTagSlugPaginated returns empty when tag not found', async () => {
    prisma.tag.findUnique.mockResolvedValue(null);
    const res = await service.findPublishedByTagSlugPaginated('no-tag', 1, 5);
    expect(res.total).toBe(0);
    expect(res.items).toHaveLength(0);
  });

  it('findRelatedPostsBySlug returns [] when base not found', async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    const res = await service.findRelatedPostsBySlug('missing');
    expect(res).toEqual([]);
  });

  it('findRelatedPostsBySlug ranks by shared categories/tags', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'p0', categories: [{ categoryId: 'c1' }], tags: [{ tagId: 't1' }] });
    prisma.post.findMany.mockResolvedValue([
      { id: 'p1', title: 'A', slug: 'a', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [{ category: { id: 'c1', name: 'C1', slug: 'c1' } }], tags: [{ tag: { id: 't1', name: 'T1', slug: 't1' } }] }, // score 3
      { id: 'p2', title: 'B', slug: 'b', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [{ category: { id: 'c1', name: 'C1', slug: 'c1' } }], tags: [] }, // score 2
      { id: 'p3', title: 'C', slug: 'c', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [], tags: [{ tag: { id: 't1', name: 'T1', slug: 't1' } }] }, // score 1
    ]);
    const res = await service.findRelatedPostsBySlug('base');
    expect(res.map(r => r.id)).toEqual(['p1','p2','p3']);
  });

  it('findPublishedByCategorySlugPaginated returns items when category tree exists', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'root' });
    // Two levels of children
    prisma.category.findMany
      .mockResolvedValueOnce([{ id: 'c1' }]) // first frontier
      .mockResolvedValueOnce([]); // terminate
    prisma.post.findMany.mockResolvedValueOnce([
      { id: 'p1', title: 'T', slug: 's', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [{ category: { id: 'c1', name: 'Cat', slug: 'cat' } }] }
    ]);
    prisma.post.count.mockResolvedValueOnce(1);
    const res = await service.findPublishedByCategorySlugPaginated('root-slug', 1, 10);
    expect(res.total).toBe(1);
    expect(res.items[0].categories[0].slug).toBe('cat');
  });

  it('findPublishedBySlugAndIncrement returns null if post not published', async () => {
    prisma.post.update.mockResolvedValue({ status: PostStatus.DRAFT, categories: [], tags: [] });
    const res = await service.findPublishedBySlugAndIncrement('draft-slug');
    expect(res).toBeNull();
  });

  it('findPublishedBySlugAndIncrement normalizes categories/tags and computes readingTime fallback', async () => {
    prisma.post.update.mockResolvedValue({
      id: '1', title: 't', slug: 's', excerpt: null, content: 'palabra '.repeat(600), readingTime: 0, publishedAt: new Date(), viewCount: 5,
      author: { id: 'u1', name: 'Author', avatarUrl: null, bio: null },
      categories: [{ category: { id: 'c1', name: 'Cat', slug: 'cat' } }],
      tags: [{ tag: { id: 't1', name: 'Tag', slug: 'tag' } }],
      status: PostStatus.PUBLISHED,
    });
    const res = await service.findPublishedBySlugAndIncrement('s');
    expect(res?.categories[0].slug).toBe('cat');
    expect(res?.tags[0].slug).toBe('tag');
    expect(res?.readingTime).toBeGreaterThan(0);
  });

  it('findPublishedPaginated returns normalized structure', async () => {
    prisma.post.findMany.mockResolvedValueOnce([
      { id: 'p1', title: 'T', slug: 't', excerpt: null, readingTime: 3, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [{ category: { id: 'c1', name: 'C', slug: 'c' } }] }
    ]);
    prisma.post.count.mockResolvedValueOnce(1);
    const res = await service.findPublishedPaginated(1, 10);
    expect(res.total).toBe(1);
    expect(res.items[0].categories[0].slug).toBe('c');
  });

  it('findPublishedByAuthorPaginated returns empty when author not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await service.findPublishedByAuthorPaginated('no-slug', 1, 10);
    expect(res.total).toBe(0);
    expect(res.items).toEqual([]);
  });

  it('findPublishedByAuthorPaginated returns items', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'auth1', slug: 'author-slug', name: 'Author' });
    prisma.post.findMany.mockResolvedValueOnce([
      { id: 'p1', title: 'A', slug: 'a', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'auth1', name: 'Author' }, categories: [{ category: { id: 'c1', name: 'Cat', slug: 'cat' } }] }
    ]);
    prisma.post.count.mockResolvedValueOnce(1);
    const res = await service.findPublishedByAuthorPaginated('author-slug', 1, 10);
    expect(res.total).toBe(1);
    expect(res.items[0].slug).toBe('a');
  });

  describe('Caching', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('caches findPublishedPaginated results for TTL window', async () => {
      prisma.post.findMany.mockResolvedValueOnce([
        { id: 'p1', title: 'T', slug: 't', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [] }
      ]);
      prisma.post.count.mockResolvedValueOnce(1);
      const first = await service.findPublishedPaginated(1, 5);
      expect(first.total).toBe(1);
      // Segunda llamada sin nuevos mocks -> debería devolver caché y no volver a invocar prisma.post.findMany
      const second = await service.findPublishedPaginated(1, 5);
      expect(second).toEqual(first);
      expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
      // Avanza el tiempo justo antes de expirar
  jest.advanceTimersByTime(DEFAULT_POSTS_CACHE_TTL_MS - 5);
      const third = await service.findPublishedPaginated(1, 5);
      expect(prisma.post.findMany).toHaveBeenCalledTimes(1); // sigue caché
      expect(third).toEqual(first);
      // Expira
  jest.advanceTimersByTime(10);
      prisma.post.findMany.mockResolvedValueOnce([
        { id: 'p2', title: 'T2', slug: 't2', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [] }
      ]);
      prisma.post.count.mockResolvedValueOnce(1);
      const afterExpire = await service.findPublishedPaginated(1, 5);
      expect(prisma.post.findMany).toHaveBeenCalledTimes(2);
      expect(afterExpire.items[0].id).toBe('p2');
    });

    it('clears cache on findPublishedBySlugAndIncrement (mutation invalidation)', async () => {
      // Seed cache
      prisma.post.findMany.mockResolvedValueOnce([
        { id: 'p1', title: 'T', slug: 't', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [] }
      ]);
      prisma.post.count.mockResolvedValueOnce(1);
      await service.findPublishedPaginated(1, 5);
      expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
      // Cached path
      await service.findPublishedPaginated(1, 5);
      expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
      // Post update (published)
      prisma.post.update = jest.fn().mockResolvedValue({
        id: 'pX', title: 'X', slug: 'slug-x', excerpt: null, content: 'hola', readingTime: 0, publishedAt: new Date(), viewCount: 1,
        author: { id: 'u', name: 'U', avatarUrl: null, bio: null },
        categories: [], tags: [], status: PostStatus.PUBLISHED
      });
      await service.findPublishedBySlugAndIncrement('slug-x');
      // New query should bypass old cache (requiere nuevo mock)
      prisma.post.findMany.mockResolvedValueOnce([
        { id: 'p2', title: 'T2', slug: 't2', excerpt: null, readingTime: 1, publishedAt: null, author: { id: 'u', name: 'U' }, categories: [] }
      ]);
      prisma.post.count.mockResolvedValueOnce(1);
      await service.findPublishedPaginated(1, 5);
      expect(prisma.post.findMany).toHaveBeenCalledTimes(2);
    });
  });
});
