import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@cms-workspace/database';
interface UserDelegateMock {
  findMany: jest.Mock<Promise<unknown[]>, [unknown?]>;
}

describe('UsersService', () => {
  let service: UsersService;

  beforeAll(async () => {
    // Deliberadamente no intersectamos con PrismaService para evitar exigir todos los métodos del delegate
    const mockPrisma: { user: UserDelegateMock } = {
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(UsersService);
  });

  it('listAuthors should return array', async () => {
    const authors = await service.listAuthors();
    expect(Array.isArray(authors)).toBe(true);
  });
});
