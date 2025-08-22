import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../app/app.module';
import { PrismaService } from '@cms-workspace/database';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import * as bcrypt from 'bcryptjs';
jest.mock('bcryptjs');

interface MockUser { id: string; email: string; roles: string[]; failedAttempts: number; lockedUntil: Date | null; passwordHash: string }
interface MockPost { id: string; title: string; content: string; status: string; authorId: string; createdAt: Date; updatedAt: Date }
interface CreateParams<T> { data: T }
interface WhereParams<T> { where: T }
interface UpdateParams<T, D> { where: T; data: D }

describe('Admin Journey E2E (mocked prisma)', () => {
  let app: INestApplication;
  // minimal mock shapes con tipado explícito
  let prismaMock: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    post: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock; count: jest.Mock; findMany: jest.Mock };
    auditLog: { create: jest.Mock };
  };
  const user: MockUser = { id: 'admin1', email: 'admin@example.com', roles: ['ADMIN'], failedAttempts: 0, lockedUntil: null, passwordHash: 'hashed' };
  const posts: MockPost[] = [];
  const auditLogs: { id: number; userId?: string; action: string; resource: string; resourceId: string }[] = [];

  beforeAll(async () => {
  (bcrypt.compare as unknown as jest.Mock).mockImplementation(async (pwd: string) => pwd === 'secret');

    prismaMock = {
      user: {
        findUnique: jest.fn().mockImplementation((params: WhereParams<{ email?: string; id?: string }>) => {
          if (params.where.email === user.email) return user;
          if (params.where.id === user.id) return user;
          return null;
        }),
        update: jest.fn().mockImplementation((params: UpdateParams<{ id: string }, Partial<MockUser>>) => {
          if (params.where.id === user.id) Object.assign(user, params.data);
          return user;
        }),
      },
      post: {
        create: jest.fn().mockImplementation((params: CreateParams<Omit<MockPost, 'id' | 'createdAt' | 'updatedAt'>>) => {
          const created: MockPost = { ...params.data, id: 'p' + (posts.length + 1), createdAt: new Date(), updatedAt: new Date() } as MockPost;
          posts.push(created);
          return created;
        }),
        findUnique: jest.fn().mockImplementation((params: WhereParams<{ id: string }>) => posts.find(p => p.id === params.where.id) || null),
        update: jest.fn().mockImplementation((params: UpdateParams<{ id: string }, Partial<MockPost>>) => {
          const idx = posts.findIndex(p => p.id === params.where.id);
          if (idx === -1) return null;
          posts[idx] = { ...posts[idx], ...params.data, updatedAt: new Date() } as MockPost;
          return posts[idx];
        }),
        delete: jest.fn().mockImplementation((params: WhereParams<{ id: string }>) => {
          const idx = posts.findIndex(p => p.id === params.where.id);
          if (idx === -1) throw new Error('not found');
          const [removed] = posts.splice(idx, 1);
          return removed;
        }),
        count: jest.fn(), // no se usa en este mock path
        findMany: jest.fn().mockImplementation((params: { where?: Partial<MockPost>; skip: number; take: number }) => {
          let filtered = [...posts];
          if (params.where?.authorId) filtered = filtered.filter(p => p.authorId === params.where?.authorId);
          if (params.where?.status) filtered = filtered.filter(p => p.status === params.where?.status);
          return filtered.slice(params.skip, params.skip + params.take).map(p => ({ ...p, categories: [], tags: [] }));
        }),
      },
      auditLog: { create: jest.fn().mockImplementation((params: CreateParams<{ userId?: string; action: string; resource: string; resourceId: string }>) => { auditLogs.push({ ...params.data, id: auditLogs.length + 1 }); return params.data; }) },
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prismaMock)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('login -> create draft -> publish -> list published', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: 'admin@example.com', password: 'secret' });
    expect(login.status).toBe(201); // created por response interceptor (POST)
    const token = login.body.data.accessToken;
    expect(token).toBeTruthy();

    const create = await request(app.getHttpServer())
      .post('/api/admin/posts')
      .set('Authorization', 'Bearer ' + token)
      .send({ title: 'Mi Post', content: 'Contenido largo', status: 'DRAFT' });
    expect(create.status).toBe(201);
    const postId = create.body.data.id;
    expect(postId).toBeTruthy();

    const publish = await request(app.getHttpServer())
      .put(`/api/admin/posts/${postId}`)
      .set('Authorization', 'Bearer ' + token)
      .send({ status: 'PUBLISHED' });
    expect(publish.status).toBe(200);
    expect(publish.body.data.status).toBe('PUBLISHED');

    const list = await request(app.getHttpServer())
      .get('/api/admin/posts?status=PUBLISHED')
      .set('Authorization', 'Bearer ' + token);
  expect(list.status).toBe(200);
  // debug shape
  // console.log(JSON.stringify(list.body, null, 2));
  // Puede que interceptor entregue data.items por items->data mapping: revise
  const arr = Array.isArray(list.body.data) ? list.body.data : list.body.data?.items || list.body.items || [];
  expect(Array.isArray(arr)).toBe(true);
  expect(arr.length).toBe(1);
  expect(arr[0].status).toBe('PUBLISHED');
  });
});
