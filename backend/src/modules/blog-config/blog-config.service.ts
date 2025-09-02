import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { UpdateBlogConfigDto } from './dto/update-blog-config.dto';
// Tipar de forma laxa para no depender del tipo generado específico
type BlogConfigEntity = {
  id: string;
  blogName: string;
  description: string | null;
  siteUrl: string | null;
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
  defaultPostImage: string | null;
  metaDescription: string | null;
  keywords: string | null;
  analyticsId: string | null;
  searchConsoleCode: string | null;
  ogImage: string | null;
  contactEmail: string | null;
  socialTwitter: string | null;
  socialLinkedIn: string | null;
  socialGithub: string | null;
  socialInstagram: string | null;
  locale: string;
  timezone: string;
  postsPerPage: number;
  enableComments: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class BlogConfigService {
  private cache: BlogConfigEntity | null = null;
  private cacheAt = 0;
  private ttlMs = 60 * 60 * 1000; // 1h

  constructor(private prisma: PrismaService) {}

  private sanitize(dto: UpdateBlogConfigDto): UpdateBlogConfigDto {
    const out: UpdateBlogConfigDto = {};
    if (dto.blogName !== undefined) out.blogName = dto.blogName.trim();
    if (dto.description !== undefined) out.description = (dto.description || '').trim() || null;
    if (dto.siteUrl !== undefined) out.siteUrl = dto.siteUrl || null;
    if (dto.metaDescription !== undefined) out.metaDescription = (dto.metaDescription || '').trim() || null;
    if (dto.keywords !== undefined) out.keywords = (dto.keywords || '').trim() || null;
    if (dto.analyticsId !== undefined) out.analyticsId = (dto.analyticsId || '').trim() || null;
    if (dto.searchConsoleCode !== undefined) out.searchConsoleCode = (dto.searchConsoleCode || '').trim() || null;
    if (dto.contactEmail !== undefined) out.contactEmail = (dto.contactEmail || '').trim() || null;
    // Passthrough para URLs de assets y sociales (ya validados por DTO)
    if (dto.logoLight !== undefined) out.logoLight = dto.logoLight || null;
    if (dto.logoDark !== undefined) out.logoDark = dto.logoDark || null;
    if (dto.favicon !== undefined) out.favicon = dto.favicon || null;
    if (dto.defaultPostImage !== undefined) out.defaultPostImage = dto.defaultPostImage || null;
    if (dto.socialTwitter !== undefined) out.socialTwitter = dto.socialTwitter || null;
    if (dto.socialLinkedIn !== undefined) out.socialLinkedIn = dto.socialLinkedIn || null;
    if (dto.socialGithub !== undefined) out.socialGithub = dto.socialGithub || null;
    if (dto.socialInstagram !== undefined) out.socialInstagram = dto.socialInstagram || null;
    if (dto.locale !== undefined) out.locale = dto.locale;
    if (dto.timezone !== undefined) out.timezone = dto.timezone;
    if (dto.postsPerPage !== undefined) out.postsPerPage = dto.postsPerPage;
    if (dto.enableComments !== undefined) out.enableComments = dto.enableComments;
    return out;
  }

  private setCache(val: BlogConfigEntity) { this.cache = val; this.cacheAt = Date.now(); }
  private isFresh() { return this.cache && (Date.now() - this.cacheAt) < this.ttlMs; }
  invalidate() { this.cache = null; this.cacheAt = 0; }

  async get() {
    if (this.isFresh()) return this.cache;
    let cfg = await this.prisma.blogConfig.findFirst();
    if (!cfg) {
      const data = { blogName: 'Mi Blog' };
      cfg = await this.prisma.blogConfig.create({ data });
    }
    this.setCache(cfg);
    return cfg;
  }

  async update(dto: UpdateBlogConfigDto) {
    const data = this.sanitize(dto);
    const existing = await this.prisma.blogConfig.findFirst();
    // Si no existe aún, crea con defaults + posibles datos
    if (!existing) {
      const created = await this.prisma.blogConfig.create({ data: { blogName: 'Mi Blog', ...data } });
      this.invalidate();
      return created;
    }
    // Si no hay cambios (objeto vacío), devolver existente y evitar error de Prisma
    if (!data || Object.keys(data).length === 0) {
      return existing as BlogConfigEntity;
    }
    const updated = await this.prisma.blogConfig.update({ where: { id: existing.id }, data });
    this.invalidate();
    return updated;
  }
}
