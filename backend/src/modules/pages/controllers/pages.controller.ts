import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PagesService } from '../pages.service';
import { PrismaService } from '@cms-workspace/database';
import { PageStatus } from '@prisma/client';

@Controller('pages')
export class PublicPagesController {
  constructor(private pages: PagesService, private prisma: PrismaService) {}

  @Get('homepage')
  homepage() { return this.pages.getHomepage(); }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const page = await this.prisma.page.findFirst({ where: { slug, status: PageStatus.PUBLISHED } });
    if(!page) throw new NotFoundException('Página no encontrada');
    // empaquetar metadatos SEO básicos (frontend los usará si quiere)
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      content: page.content,
      excerpt: page.excerpt,
      seo: {
        title: page.seoTitle || page.title,
        description: page.seoDescription || page.excerpt || page.content.slice(0,160),
        keywords: page.seoKeywords || undefined,
        canonical: `/pages/${page.slug}`
      },
      updatedAt: page.updatedAt,
    };
  }
}
