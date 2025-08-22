import { MenuService } from './menu.service';
import { MenuItemType } from '@prisma/client';

describe('MenuService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: Record<string, any>;
  let service: MenuService;

  beforeEach(() => {
    prisma = {
      menuItem: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops))
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service = new MenuService(prisma as any);
  });

  it('listPublic aplica filtro isVisible y orden', async () => {
    prisma.menuItem.findMany.mockResolvedValue([]);
    await service.listPublic();
    expect(prisma.menuItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isVisible: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }]
    }));
  });

  it('create delega en prisma.menuItem.create', async () => {
    prisma.menuItem.create.mockResolvedValue({ id: 'm1' });
    const res = await service.create({ title: 'Home', type: MenuItemType.PAGE });
    expect(res.id).toBe('m1');
  });

  it('reorder genera transacción por cada item', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.menuItem.update = jest.fn().mockImplementation(({ where }: any) => ({ id: where.id }));
    await service.reorder([{ id: 'a', sortOrder: 1 }, { id: 'b', sortOrder: 2 }]);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
