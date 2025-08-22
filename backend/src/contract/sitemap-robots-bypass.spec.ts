import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../app/app.module';
import { PrismaService } from '@cms-workspace/database';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

describe('SEO endpoints bypass interceptor', () => {
  let app: INestApplication;

  beforeAll(async () => {
    type FindManyFn<T> = { findMany: jest.Mock<Promise<T[]>, [unknown?]> };
    const prismaMock: Partial<PrismaService> = {
      post: { findMany: jest.fn().mockResolvedValue([{ slug: 'post-1', updatedAt: new Date(), publishedAt: new Date() }]) } as FindManyFn<{ slug: string; updatedAt: Date; publishedAt: Date }> as unknown as PrismaService['post'],
      page: { findMany: jest.fn().mockResolvedValue([{ slug: 'about', updatedAt: new Date(), isHomepage: false }]) } as FindManyFn<{ slug: string; updatedAt: Date; isHomepage: boolean }> as unknown as PrismaService['page'],
      category: { findMany: jest.fn().mockResolvedValue([{ slug: 'cat-1', updatedAt: new Date() }]) } as FindManyFn<{ slug: string; updatedAt: Date }> as unknown as PrismaService['category'],
      tag: { findMany: jest.fn().mockResolvedValue([{ slug: 'tag-1', updatedAt: new Date() }]) } as FindManyFn<{ slug: string; updatedAt: Date }> as unknown as PrismaService['tag'],
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('GET /api/sitemap.xml returns raw xml (not wrapped)', async () => {
    const res = await request(app.getHttpServer()).get('/api/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/xml');
    expect(res.text.startsWith('<?xml')).toBe(true);
    expect(res.text.includes('success')).toBe(false);
  });

  it('GET /api/robots.txt returns raw text (not wrapped)', async () => {
    const res = await request(app.getHttpServer()).get('/api/robots.txt');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text.includes('User-agent: *')).toBe(true);
    expect(res.text.includes('success')).toBe(false);
  });
});
