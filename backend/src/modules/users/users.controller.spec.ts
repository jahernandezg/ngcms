import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { UsersModule } from './users.module';
import { DatabaseModule, PrismaService } from '@cms-workspace/database';
interface UserDelegateMock {
  findMany: jest.Mock<Promise<unknown[]>, [unknown?]>;
  findUnique: jest.Mock<Promise<unknown | null>, [unknown]>;
}
// Extend mock to simulate not found for detail


describe('UsersController (e2e-light)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockPrisma: { user: UserDelegateMock } = {
      user: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, UsersModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/authors (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/authors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/authors/:id 404 (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/authors/does-not-exist');
    // Nest default NotFoundException = 404 status with response object
    expect(res.status).toBe(404);
  });
});
