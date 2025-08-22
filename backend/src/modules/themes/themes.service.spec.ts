import { ThemesService } from './themes.service';

describe('ThemesService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: Record<string, any>;
  let service: ThemesService;

  beforeEach(() => {
    prisma = {
      themeSettings: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
      },
      $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops))
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new ThemesService(prisma as any);
  });

  it('setActive desactiva anteriores y activa nuevo', async () => {
    prisma.themeSettings.findUnique.mockResolvedValue({ id: 't1' });
    prisma.themeSettings.updateMany.mockResolvedValue({ count: 1 });
    prisma.themeSettings.update.mockResolvedValue({ id: 't1', isActive: true });
    const res = await service.setActive('t1');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(res[1].isActive).toBe(true);
  });

  it('create acepta colores sin validación estricta', async () => {
    prisma.themeSettings.create.mockResolvedValue({ id: 't1', name: 'x' });
    await service.create({ name: 'x', primaryColor: '#fff', secondaryColor: 'red' });
    expect(prisma.themeSettings.create).toHaveBeenCalled();
  });

  it('sanitiza customCss removiendo @import y scripts', async () => {
  interface CreateArg { data: Record<string, unknown>; }
  prisma.themeSettings.create.mockImplementation((arg: CreateArg) => ({ id: 't2', ...arg.data }));
    const res = await service.create({ name: 'y', customCss: '@import url(http://x); body{color:#000;} <script>alert(1)</script>' });
    expect(res.customCss).not.toMatch(/@import/);
    expect(res.customCss).not.toMatch(/script/);
  });

  it('updateAndActivate actualiza colores y activa', async () => {
    prisma.themeSettings.findUnique.mockResolvedValue({ id: 't3', isActive: false });
    prisma.themeSettings.updateMany.mockResolvedValue({ count: 1 });
    prisma.themeSettings.update.mockResolvedValue({ id: 't3', isActive: true, primaryColor: '#abc' });
    const res = await service.updateAndActivate('t3', { primaryColor: '#abc' });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(res[1].isActive).toBe(true);
  });

  it('delete elimina tema no activo', async () => {
    prisma.themeSettings.findUnique.mockResolvedValue({ id: 't4', isActive: false });
    prisma.themeSettings.delete.mockResolvedValue({ id: 't4' });
    const res = await service.delete('t4');
    expect(res.id).toBe('t4');
    expect(res.deleted).toBe(true);
  });

  it('delete impide borrar único activo', async () => {
    prisma.themeSettings.findUnique.mockResolvedValue({ id: 't5', isActive: true });
    prisma.themeSettings.findMany.mockResolvedValue([]); // sin candidatos
    await expect(service.delete('t5')).rejects.toThrow('único tema');
  });

  it('delete reasigna activo al eliminar tema activo con candidatos', async () => {
    prisma.themeSettings.findUnique.mockResolvedValue({ id: 't6', isActive: true });
    prisma.themeSettings.findMany.mockResolvedValue([{ id: 't7' }]);
    prisma.themeSettings.delete.mockResolvedValue({ id: 't6' });
    prisma.themeSettings.update.mockResolvedValue({ id: 't7', isActive: true });
    const res = await service.delete('t6');
    expect(res.reassignedActive).toBe('t7');
  });
});
