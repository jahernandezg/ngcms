import { Controller, Get, Header } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { PostStatus, PageStatus } from '@prisma/client';

@Controller()
export class SeoController {
  constructor(private prisma: PrismaService) {}

  // Microcache simple (TTL 60s) para reducir carga en DB y generación de XML
  private sitemapCache?: { xml: string; generatedAt: number };
  private readonly SITEMAP_TTL_MS = 60_000; // 60 segundos

  private getSiteUrl() {
    return process.env.SITE_URL || 'http://localhost:4000';
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async sitemap() {
    if (this.sitemapCache && Date.now() - this.sitemapCache.generatedAt < this.SITEMAP_TTL_MS) {
      return this.sitemapCache.xml; // devolver cache válido
    }
    const site = this.getSiteUrl().replace(/\/$/, '');

    const [posts, pages, categories, tags] = await Promise.all([
      this.prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.page.findMany({
        where: { status: PageStatus.PUBLISHED },
        select: { slug: true, updatedAt: true, isHomepage: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
      this.prisma.tag.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

  const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[] = [];

  // homepage: determinar lastmod a partir de la página marcada como homepage (si publicada)
  const homepage = pages.find(p=>p.isHomepage);
  urls.push({ loc: `${site}/`, changefreq: 'daily', priority: '1.0', lastmod: homepage?.updatedAt?.toISOString() });

  // página de búsqueda estática
  urls.push({ loc: `${site}/search`, changefreq: 'weekly', priority: '0.6' });

    // posts
    for (const p of posts) {
      urls.push({
        loc: `${site}/post/${p.slug}`,
        lastmod: (p.updatedAt || p.publishedAt)?.toISOString(),
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    // pages (excluyendo homepage ya cubierta por "/")
    for (const pg of pages) {
      if (pg.isHomepage) continue;
      urls.push({
        loc: `${site}/pages/${pg.slug}`,
        lastmod: pg.updatedAt?.toISOString(),
        changefreq: 'monthly',
        priority: '0.7',
      });
    }

    // categorías
    for (const c of categories) {
      urls.push({
        loc: `${site}/category/${c.slug}`,
        lastmod: c.updatedAt?.toISOString(),
        changefreq: 'weekly',
        priority: '0.6',
      });
    }

    // tags
    for (const t of tags) {
      urls.push({
        loc: `${site}/tag/${t.slug}`,
        lastmod: t.updatedAt?.toISOString(),
        changefreq: 'weekly',
        priority: '0.5',
      });
    }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      urls
        .map(
          (u) =>
            `<url>` +
            `<loc>${u.loc}</loc>` +
            (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '') +
            (u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : '') +
            (u.priority ? `<priority>${u.priority}</priority>` : '') +
            `</url>`
        )
        .join('') +
      `</urlset>`;
  this.sitemapCache = { xml, generatedAt: Date.now() };
  return xml;
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  robots() {
    const site = this.getSiteUrl().replace(/\/$/, '');
    return [`User-agent: *`, `Allow: /`, `Sitemap: ${site}/sitemap.xml`].join('\n');
  }
}
