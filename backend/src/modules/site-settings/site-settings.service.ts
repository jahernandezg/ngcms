import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';

export interface SiteSettingsDto { siteName?: string; tagline?: string | null; defaultMetaDesc?: string | null; logoUrl?: string | null; faviconUrl?: string | null; }

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const data = await this.prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!data) return this.prisma.siteSettings.create({ data: { id: 'default', siteName: 'CMS', tagline: null } });
    return data;
  }

  async update(data: SiteSettingsDto) {
    const existing = await this.prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!existing) throw new NotFoundException('Site settings missing');
    const toUpdate: SiteSettingsDto = {};
    if (data.siteName !== undefined) {
      const name = data.siteName.trim();
      if (name.length < 2) throw new BadRequestException('siteName demasiado corto');
      if (name.length > 80) throw new BadRequestException('siteName demasiado largo');
      toUpdate.siteName = name;
    }
    if (data.tagline !== undefined) {
      const tag = (data.tagline || '').trim();
      if (tag.length > 140) throw new BadRequestException('tagline demasiado larga');
      toUpdate.tagline = tag || null;
    }
    if (data.defaultMetaDesc !== undefined) {
      const raw = (data.defaultMetaDesc || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (raw.length > 300) throw new BadRequestException('defaultMetaDesc demasiado larga');
      toUpdate.defaultMetaDesc = raw || null;
    }
    if (data.logoUrl !== undefined) {
      toUpdate.logoUrl = data.logoUrl || null;
    }
    if (data.faviconUrl !== undefined) {
      toUpdate.faviconUrl = data.faviconUrl || null;
    }
    return this.prisma.siteSettings.update({ where: { id: 'default' }, data: toUpdate });
  }
}
