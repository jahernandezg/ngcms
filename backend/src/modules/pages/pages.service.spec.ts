import { PagesService } from './pages.service';
import { SlugService } from '../shared/slug/slug.service';
import { PageStatus } from '@prisma/client';

describe('PagesService', () => {
  let service: PagesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: Record<string, any>;
  let slug: SlugService;

  beforeEach(() => {
    prisma = {
      page: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (fn: unknown) => {
        if (typeof fn === 'function') {
          return (fn as (tx: unknown)=>unknown)(prisma); // callback style
        }
        return Promise.all((fn as unknown[]).map(p => p));
      })
    };
  // Cast controlado para tests (prisma mock parcial)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slug = new SlugService(prisma as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service = new PagesService(prisma as any, slug);
  });

  it('create llama a slugService y crea homepage limpiando anterior', async () => {
    prisma.page.create.mockResolvedValue({ id: 'p1', slug: 'about' });
    prisma.page.updateMany.mockResolvedValue({ count: 1 });
    const spy = jest.spyOn(slug, 'assertUnique').mockResolvedValue();
    const res = await service.create('author1', { title: 'About', slug: 'about', content: 'contenido largo suficiente', isHomepage: true });
    expect(spy).toHaveBeenCalledWith('about');
    expect(prisma.page.updateMany).toHaveBeenCalledWith({ data: { isHomepage: false }, where: { isHomepage: true } });
    expect(prisma.page.create).toHaveBeenCalled();
    expect(res.slug).toBe('about');
  });

  it('update cambia slug verificando unicidad y maneja homepage', async () => {
    prisma.page.findUnique.mockResolvedValue({ id: 'p1', slug: 'old', isHomepage: false });
    prisma.page.update.mockResolvedValue({ id: 'p1', slug: 'new' });
    prisma.page.updateMany.mockResolvedValue({ count: 1 });
    const spy = jest.spyOn(slug, 'assertUnique').mockResolvedValue();
    const res = await service.update('p1', { slug: 'new', isHomepage: true });
    expect(spy).toHaveBeenCalledWith('new', { ignorePageId: 'p1' });
    expect(prisma.page.updateMany).toHaveBeenCalled();
    expect(res.slug).toBe('new');
  });

  it('setHomepage desmarca otras', async () => {
    prisma.page.findUnique.mockResolvedValue({ id: 'p2', slug: 'contact' });
    prisma.page.updateMany.mockResolvedValue({ count: 1 });
    prisma.page.update.mockResolvedValue({ id: 'p2', isHomepage: true });
    const res = await service.setHomepage('p2');
    expect(prisma.page.updateMany).toHaveBeenCalledWith({ data: { isHomepage: false }, where: { isHomepage: true } });
    expect(res.isHomepage).toBe(true);
  });

  it('adminList retorna items y total', async () => {
    prisma.page.findMany.mockResolvedValue([{ id: 'p1' }]);
    prisma.page.count.mockResolvedValue(1);
    const res = await service.adminList(1, 10, PageStatus.PUBLISHED);
    expect(res.total).toBe(1);
    expect(res.items[0].id).toBe('p1');
    expect(prisma.page.findMany).toHaveBeenCalled();
  });
});
