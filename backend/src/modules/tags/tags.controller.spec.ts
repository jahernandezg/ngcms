import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { TagsModule } from './tags.module';
import { DatabaseModule, PrismaService } from '@cms-workspace/database';

interface TagDelegateMock { findMany: jest.Mock<Promise<unknown[]>, [unknown?]> }

describe('TagsController (e2e-light)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const mockPrisma: { tag: TagDelegateMock } = { tag: { findMany: jest.fn().mockResolvedValue([]) } };
    const module: TestingModule = await Test.createTestingModule({ imports: [DatabaseModule, TagsModule] })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('/tags (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
