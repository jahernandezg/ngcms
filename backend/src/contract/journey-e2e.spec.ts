import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../app/app.module';
import { PostsService } from '../modules/posts/posts.service';
import { SearchService } from '../modules/search/search.service';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

describe('Journey E2E (mocked services)', () => {
  let app: INestApplication;
  const mockList = {
    items: [
      { id: '1', title: 'Post 1', slug: 'post-1', readingTime: 3, author: { id: 'a1', name: 'Author' }, categories: [] },
    ],
    total: 1,
    page: 1,
    limit: 5,
  };
  const mockPostDetail = {
    id: '1',
    title: 'Post 1',
    slug: 'post-1',
    content: 'Body',
    excerpt: 'Body',
    readingTime: 3,
    publishedAt: new Date().toISOString(),
    viewCount: 1,
    author: { id: 'a1', name: 'Author', avatarUrl: null, bio: null },
    categories: [],
    tags: [],
  };
  const related = [
    { id: '2', title: 'Rel 1', slug: 'rel-1', excerpt: 'R', readingTime: 2, publishedAt: new Date().toISOString(), author: { id: 'a1', name: 'Author' }, categories: [], tags: [] },
  ];

  beforeAll(async () => {
    const postsServiceMock: Partial<PostsService> = {
      findPublishedPaginated: jest.fn().mockResolvedValue(mockList),
      findPublishedBySlugAndIncrement: jest.fn().mockResolvedValue(mockPostDetail),
      findRelatedPostsBySlug: jest.fn().mockResolvedValue(related),
      findPublishedByCategorySlugPaginated: jest.fn().mockResolvedValue({ ...mockList, category: 'tech' }),
      findPublishedByTagSlugPaginated: jest.fn().mockResolvedValue({ ...mockList, tag: 'angular' }),
    };
    const searchServiceMock: Partial<SearchService> = {
      searchPosts: jest.fn().mockResolvedValue({ ...mockList, q: 'post' }),
      suggest: jest.fn().mockResolvedValue({ titles: ['Post 1'], tags: [{ name: 'Angular', slug: 'angular' }] }),
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PostsService).useValue(postsServiceMock)
      .overrideProvider(SearchService).useValue(searchServiceMock)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  function expectShape(obj: unknown, keys: string[]) {
    expect(obj && typeof obj === 'object').toBe(true);
    const rec = obj as Record<string, unknown>;
    for (const k of keys) expect(Object.prototype.hasOwnProperty.call(rec, k)).toBe(true);
  }

  it('full content journey', async () => {
    const list = await request(app.getHttpServer()).get('/api/posts?page=1&limit=5');
    expect(list.status).toBe(200);
    expectShape(list.body.meta, ['total', 'page', 'limit', 'totalPages']);

    const detail = await request(app.getHttpServer()).get('/api/posts/post-1');
    expect(detail.status).toBe(200);
    expect(detail.body.data.slug).toBe('post-1');
    expectShape(detail.body.data, ['id','title','slug','content','author']);

    const rel = await request(app.getHttpServer()).get('/api/posts/post-1/related');
    expect(rel.status).toBe(200);
    if (rel.body.data.length) expectShape(rel.body.data[0], ['id','title','slug']);

    const cat = await request(app.getHttpServer()).get('/api/posts/category/tech?page=1&limit=5');
    expect(cat.status).toBe(200);
    expect(cat.body.meta.category).toBe('tech');

    const tag = await request(app.getHttpServer()).get('/api/posts/tag/angular?page=1&limit=5');
    expect(tag.status).toBe(200);
    expect(tag.body.meta.tag).toBe('angular');

    const search = await request(app.getHttpServer()).get('/api/search/posts?q=post&page=1&limit=5');
    expect(search.status).toBe(200);
    expect(search.body.meta.q).toBe('post');

    const suggest = await request(app.getHttpServer()).get('/api/search/suggest?q=po&limit=5');
    expect(suggest.status).toBe(200);
    expect(Array.isArray(suggest.body.data.titles)).toBe(true);
  });
});
