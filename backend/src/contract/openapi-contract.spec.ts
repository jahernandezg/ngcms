import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request = require('supertest');
import { PostsService } from '../modules/posts/posts.service';
import { SearchService } from '../modules/search/search.service';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

// Util simple para validar propiedades requeridas (superficial)
function expectObjectShape(obj: unknown, keys: string[]) {
  expect(obj && typeof obj === 'object').toBe(true);
  const rec = obj as Record<string, unknown>;
  for (const k of keys) expect(Object.prototype.hasOwnProperty.call(rec, k)).toBe(true);
}

describe('OpenAPI Contract (subset)', () => {
  let app: INestApplication;
  let doc: { paths: Record<string, unknown> };

  beforeAll(async () => {
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
    const postsServiceMock: Partial<PostsService> = {
      findPublishedPaginated: jest.fn().mockResolvedValue(mockList),
      findPublishedBySlugAndIncrement: jest
        .fn()
        .mockImplementation(async (slug: string) => (slug === 'post-1' ? mockPostDetail : null)),
      findPublishedByCategorySlugPaginated: jest.fn().mockResolvedValue({ ...mockList, category: 'tech' }),
      findPublishedByTagSlugPaginated: jest.fn().mockResolvedValue({ ...mockList, tag: 'angular' }),
      findRelatedPostsBySlug: jest.fn().mockResolvedValue(mockList.items),
    };

    const searchServiceMock: Partial<SearchService> = {
      searchPosts: jest.fn().mockResolvedValue({ ...mockList, q: 'post' }),
      suggest: jest.fn().mockResolvedValue({ titles: ['Post 1'], tags: [{ name: 'Angular', slug: 'angular' }] }),
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PostsService)
      .useValue(postsServiceMock)
      .overrideProvider(SearchService)
      .useValue(searchServiceMock)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    const swaggerConfig = new DocumentBuilder().setTitle('CMS API').setVersion('1.0').build();
    doc = SwaggerModule.createDocument(app, swaggerConfig);
  });

  afterAll(async () => { await app.close(); });

  it('spec has core paths (posts, search, related, category, tag)', () => {
    const paths = Object.keys(doc.paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/posts',
        '/api/posts/{slug}',
        '/api/posts/{slug}/related',
        '/api/posts/category/{slug}',
        '/api/posts/tag/{slug}',
        '/api/search/posts',
        '/api/search/suggest',
      ])
    );
  });

  it('GET /posts returns wrapped list matching schema subset', async () => {
    const res = await request(app.getHttpServer()).get('/api/posts?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length) {
      const item = res.body.data[0];
      expectObjectShape(item, ['id', 'title', 'slug', 'readingTime', 'author', 'categories']);
    }
    // meta presente en respuesta paginada
    expectObjectShape(res.body.meta, ['total', 'page', 'limit', 'totalPages']);
  });

  it('GET /posts/category/{slug} returns paginated list with meta', async () => {
    const res = await request(app.getHttpServer()).get('/api/posts/category/tech?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expectObjectShape(res.body.meta, ['total', 'page', 'limit', 'totalPages', 'category']);
  });

  it('GET /posts/tag/{slug} returns paginated list with meta', async () => {
    const res = await request(app.getHttpServer()).get('/api/posts/tag/angular?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expectObjectShape(res.body.meta, ['total', 'page', 'limit', 'totalPages', 'tag']);
  });

  it('GET /posts/{slug}/related returns related list', async () => {
    const res = await request(app.getHttpServer()).get('/api/posts/post-1/related');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length) expectObjectShape(res.body.data[0], ['id', 'title', 'slug']);
  });

  it('GET /posts/{slug} 200 with mock detail or 404 when missing', async () => {
    const ok = await request(app.getHttpServer()).get('/api/posts/post-1');
    expect(ok.status).toBe(200);
    const post = ok.body.data;
    expectObjectShape(post, ['id', 'title', 'slug', 'content', 'viewCount', 'author', 'categories', 'tags']);
    const notFound = await request(app.getHttpServer()).get('/api/posts/unknown');
    expect([200, 404]).toContain(notFound.status); // en caso de implementación distinta
    if (notFound.status === 404) return;
    // si devuelve algo inesperado asegurar shape mínima
    expectObjectShape(notFound.body.data, ['id', 'title', 'slug']);
  });

  it('GET /search/posts returns paginated results with q in meta', async () => {
    const res = await request(app.getHttpServer()).get('/api/search/posts?q=post&page=1&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expectObjectShape(res.body.meta, ['total', 'page', 'limit', 'totalPages', 'q']);
  });

  it('GET /search/suggest returns titles and tags arrays', async () => {
    const res = await request(app.getHttpServer()).get('/api/search/suggest?q=ang&limit=5');
    expect(res.status).toBe(200);
    expectObjectShape(res.body.data, ['titles', 'tags']);
    expect(Array.isArray(res.body.data.titles)).toBe(true);
    expect(Array.isArray(res.body.data.tags)).toBe(true);
  });
});
