import { Test, TestingModule } from '@nestjs/testing';
import { AdminPostsService } from './admin-posts.service';
import { PrismaService } from '@cms-workspace/database';
import { AuditService } from './audit.service';
import { PostStatus } from '@prisma/client';

class PrismaMock {
  post = {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
  user = { findUnique: jest.fn() };
  auditLog = { create: jest.fn() };
}

class AuditMock { log = jest.fn().mockResolvedValue(undefined); }

describe('AdminPostsService', () => {
  let service: AdminPostsService;
  let prisma: PrismaMock;
  let audit: AuditMock;

  beforeEach(async () => {
    prisma = new PrismaMock();
    audit = new AuditMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit }
      ]
    }).compile();
    service = module.get(AdminPostsService);
  });

  it('findAll devuelve estructura vacía paginada', async () => {
    const res = await service.findAll(undefined, 1, 10);
    expect(res).toEqual({ items: [], total: 0, page: 1, limit: 10 });
    expect(prisma.post.findMany).toHaveBeenCalled();
  });

  it('create crea post y audita', async () => {
  const mockCreated: { id: string; title: string; status: PostStatus; content: string; updatedAt: Date; categories: unknown[]; tags: unknown[] } = { id: '1', title: 'T', status: PostStatus.DRAFT, content: 'c', updatedAt: new Date(), categories: [], tags: [] };
    prisma.post.create.mockResolvedValue(mockCreated);
    const result = await service.create('uid', { title: 'Titulo', content: '<p>Hola</p>', status: PostStatus.DRAFT });
    expect(result).toBe(mockCreated);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', resource: 'Post', resourceId: '1' }));
  });
});
