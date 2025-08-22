import { Test, TestingModule } from '@nestjs/testing';
import { SiteSettingsService } from './site-settings.service';
import { PrismaService } from '@cms-workspace/database';

const mockPrisma = {
  siteSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }
};

describe('SiteSettingsService', () => {
  let service: SiteSettingsService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiteSettingsService, { provide: PrismaService, useValue: mockPrisma }]
    }).compile();
    service = module.get(SiteSettingsService);
    jest.clearAllMocks();
  });

  it('creates default if missing on get', async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValueOnce(null);
    mockPrisma.siteSettings.create.mockResolvedValueOnce({ id: 'default', siteName: 'CMS' });
    const res = await service.get();
    expect(res.id).toBe('default');
    expect(mockPrisma.siteSettings.create).toHaveBeenCalled();
  });

  it('updates existing settings', async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValue({ id: 'default', siteName: 'CMS' });
    mockPrisma.siteSettings.update.mockResolvedValue({ id: 'default', siteName: 'Nuevo' });
    const res = await service.update({ siteName: 'Nuevo' });
    expect(res.siteName).toBe('Nuevo');
  });

  it('validates siteName length', async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValue({ id: 'default', siteName: 'CMS' });
    await expect(service.update({ siteName: 'A' })).rejects.toThrow('siteName demasiado corto');
  });

  it('sanitizes defaultMetaDesc stripping HTML and trimming', async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValue({ id: 'default', siteName: 'CMS' });
    mockPrisma.siteSettings.update.mockResolvedValue({ id: 'default', siteName: 'CMS', defaultMetaDesc: 'Hola mundo' });
    const res = await service.update({ defaultMetaDesc: '  <b>Hola</b>   mundo  ' });
    expect(res.defaultMetaDesc).toBe('Hola mundo');
  });
});
