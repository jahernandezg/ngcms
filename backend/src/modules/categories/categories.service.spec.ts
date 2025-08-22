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
});
