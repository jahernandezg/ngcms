import { BlogConfigService } from './blog-config.service';
import { PrismaService } from '@cms-workspace/database';

// PrismaService stub simple en memoria
type ConfigShape = {
  id: string; blogName: string; description?: string | null; siteUrl?: string | null;
  logoLight?: string | null; logoDark?: string | null; favicon?: string | null; defaultPostImage?: string | null;
  metaDescription?: string | null; keywords?: string | null; analyticsId?: string | null; searchConsoleCode?: string | null; ogImage?: string | null;
  contactEmail?: string | null; socialTwitter?: string | null; socialLinkedIn?: string | null; socialGithub?: string | null; socialInstagram?: string | null;
  locale: string; timezone: string; postsPerPage: number; enableComments: boolean; createdAt: Date; updatedAt: Date;
};

class PrismaStub {
  data: ConfigShape | null = null;
  blogConfig = {
    findFirst: jest.fn(async () => this.data),
    create: jest.fn(async ({ data }: { data: Partial<ConfigShape> }) => (this.data = { id: '1', createdAt: new Date(), updatedAt: new Date(), locale: 'es-ES', timezone: 'Europe/Madrid', postsPerPage: 10, enableComments: true, blogName: 'Mi Blog', ...data } as ConfigShape)),
    update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Partial<ConfigShape> }) => (this.data = { ...(this.data as ConfigShape), ...data, id } as ConfigShape)),
  };
}

describe('BlogConfigService - cache', () => {
  let svc: BlogConfigService; let prisma: PrismaStub;
  beforeEach(() => { prisma = new PrismaStub(); svc = new BlogConfigService(prisma as unknown as PrismaService); });

  it('crea default y cachea', async () => {
    const c1 = await svc.get();
    const c2 = await svc.get();
    expect(c1).toBe(c2); // mismo objeto por caché
  });

  it('invalida caché tras update', async () => {
    await svc.get();
    const up = await svc.update({ blogName: 'Nuevo' });
    expect(up.blogName).toBe('Nuevo');
    const after = await svc.get();
    expect(after.blogName).toBe('Nuevo');
  });
});
