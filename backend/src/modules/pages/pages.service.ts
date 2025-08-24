import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { SlugService } from '../shared/slug/slug.service';
import { PageStatus } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService, private slugService: SlugService) {}

  private sanitizeContent(html: string) {
    return sanitizeHtml(html, {
      allowedTags: Array.from(new Set([
        ...sanitizeHtml.defaults.allowedTags,
        'img','h1','h2','h3','h4','h5','h6','pre','code','blockquote'
      ])),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href','name','target','rel'],
        img: ['src','alt'],
        '*': ['class']
      },
      allowedSchemes: ['http','https','mailto','data']
    });
  }

  private decodeEntities(str: string) {
    return str
      .replace(/&lt;/g,'<')
      .replace(/&gt;/g,'>')
      .replace(/&amp;/g,'&')
      .replace(/&quot;/g,'"')
      .replace(/&#39;/g,"'");
  }

  // Si el contenido es un bloque de código Quill conteniendo HTML escapado, lo desenvuelve.
  private unwrapQuillPre(content?: string | null) {
    if (!content) return '';
    const m = content.match(/^<pre[^>]*class="ql-syntax"[^>]*>([\s\S]*?)<\/pre>$/);
    if (m) {
      const inner = m[1];
      // Si el inner contiene entidades HTML comunes asumimos que es HTML pegado y no un snippet de ejemplo.
      if (inner.includes('&lt;') && /&lt;\w+/.test(inner)) {
        return this.decodeEntities(inner);
      }
    }
    return content;
  }

  private normalizeContent(raw: string) {
    return this.sanitizeContent(this.unwrapQuillPre(raw));
  }

  async create(authorId: string, dto: CreatePageDto) {
    await this.slugService.assertUnique(dto.slug);
    return this.prisma.$transaction(async(tx)=>{
      if (dto.isHomepage) {
        await tx.page.updateMany({ data: { isHomepage: false }, where: { isHomepage: true } });
      }
  const content = this.normalizeContent(dto.content);
  return tx.page.create({ data: { ...dto, content, authorId } });
    });
  }

  async update(id: string, dto: UpdatePageDto) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Página no encontrada');
    if (dto.slug && dto.slug !== existing.slug) {
      await this.slugService.assertUnique(dto.slug, { ignorePageId: id });
    }
    return this.prisma.$transaction(async(tx)=>{
      if (dto.isHomepage) {
        await tx.page.updateMany({ data: { isHomepage: false }, where: { isHomepage: true, NOT: { id } } });
      }
      const data: UpdatePageDto & { content?: string } = { ...dto };
      if (dto.content !== undefined) {
        data.content = this.normalizeContent(dto.content);
      }
      return tx.page.update({ where: { id }, data });
    });
  }

  async setHomepage(id: string) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Página no encontrada');
    return this.prisma.$transaction(async(tx)=>{
      await tx.page.updateMany({ data: { isHomepage: false }, where: { isHomepage: true } });
      return tx.page.update({ where: { id }, data: { isHomepage: true } });
    });
  }

  async findPublicBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({ where: { slug, status: PageStatus.PUBLISHED } });
    if (!page) return page;
    return { ...page, content: this.unwrapQuillPre(page.content) };
  }
  async getHomepage() {
    const page = await this.prisma.page.findFirst({ where: { isHomepage: true, status: PageStatus.PUBLISHED } });
    if (!page) return page;
    return { ...page, content: this.unwrapQuillPre(page.content) };
  }
  async adminList(page=1, limit=10, status?: PageStatus) {
    const [itemsRaw, total] = await this.prisma.$transaction([
      this.prisma.page.findMany({ skip: (page-1)*limit, take: limit, where: status? { status }: undefined, orderBy: { createdAt: 'desc' } }),
      this.prisma.page.count({ where: status? { status }: undefined })
    ]);
    const items = itemsRaw.map(p => ({ ...p, content: this.unwrapQuillPre(p.content) }));
    return { items, total };
  }
  async adminGet(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Página no encontrada');
    return { ...page, content: this.unwrapQuillPre(page.content) };
  }
  async remove(id: string) {
    await this.prisma.page.delete({ where: { id } });
    return { deleted: true };
  }
}
