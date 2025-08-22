import { SlugService } from './slug.service';

describe('SlugService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: Record<string, any>;
  let service: SlugService;

  beforeEach(() => {
    prisma = {
      post: { findUnique: jest.fn() },
      page: { findUnique: jest.fn() }
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service = new SlugService(prisma as any);
  });

  it('permite slug cuando no existe', async () => {
    await expect(service.assertUnique('nuevo')).resolves.toBeUndefined();
  });

  it('rechaza slug de post existente', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
    await expect(service.assertUnique('dup')).rejects.toThrow('Slug ya utilizado por un post');
  });

  it('rechaza slug de page existente distinta', async () => {
    prisma.page.findUnique.mockResolvedValue({ id: 'pg1' });
    await expect(service.assertUnique('dup')).rejects.toThrow('Slug ya utilizado por una página');
  });

  it('permite slug si coincide con page ignorada', async () => {
    prisma.page.findUnique.mockResolvedValue({ id: 'pg1' });
    await expect(service.assertUnique('same', { ignorePageId: 'pg1' })).resolves.toBeUndefined();
  });
});
