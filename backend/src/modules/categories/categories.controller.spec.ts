import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { CategoriesModule } from './categories.module';
import { DatabaseModule, PrismaService } from '@cms-workspace/database';

interface CategoryDelegateMock { findMany: jest.Mock<Promise<unknown[]>, [unknown?]> }

describe('CategoriesController (e2e-light)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const mockPrisma: { category: CategoryDelegateMock } = { category: { findMany: jest.fn().mockResolvedValue([]) } };
    const module: TestingModule = await Test.createTestingModule({ imports: [DatabaseModule, CategoriesModule] })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('/categories/tree (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/categories/tree');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/categories (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
