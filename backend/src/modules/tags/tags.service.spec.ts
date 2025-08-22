import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { PrismaService } from '@cms-workspace/database';
interface TagDelegateMock {
  findMany: jest.Mock<Promise<unknown[]>, [unknown?]>;
}

describe('TagsService', () => {
  let service: TagsService;

  beforeAll(async () => {
    const mockPrisma: { tag: TagDelegateMock } = {
      tag: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(TagsService);
  });

  it('list returns array', async () => {
    const tags = await service.list();
    expect(Array.isArray(tags)).toBe(true);
  });
});
