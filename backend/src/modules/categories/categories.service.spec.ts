import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '@cms-workspace/database';
interface CategoryDelegateMock {
  findMany: jest.Mock<Promise<unknown[]>, [unknown?]>;
}

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeAll(async () => {
    const mockPrisma: { category: CategoryDelegateMock } = {
      category: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(CategoriesService);
  });

  it('listTree returns array', async () => {
    const tree = await service.listTree();
    expect(Array.isArray(tree)).toBe(true);
  });

  it('listAll returns array and uses expected select/order', async () => {
    const prisma = (service as unknown as { prisma: { category: CategoryDelegateMock } }).prisma;
    prisma.category.findMany.mockResolvedValueOnce([]);
    const all = await service.listAll();
    expect(Array.isArray(all)).toBe(true);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  });
});
