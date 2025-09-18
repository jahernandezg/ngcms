import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@cms-workspace/database';
import sanitizeHtml from 'sanitize-html';
import { AuditService } from './audit.service';

// Sanitización consistente para CREATE y UPDATE.
// Permitimos un conjunto ampliado de etiquetas comunes de contenido rico.
// Nota: Revisar políticas CSP y si se desea permitir 'style'. Por ahora sólo 'class' global.
const sanitizeContent = (html: string) => sanitizeHtml(html, {
  allowedTags: Array.from(new Set([
    ...sanitizeHtml.defaults.allowedTags,
    'img','h1','h2','h3','h4','h5','h6','pre','code','blockquote',
    // Formularios y controles
    'form','input','button','select','option','textarea','label','fieldset','legend'
  ])),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt'],
    // Atributos para formularios y controles
    form: ['id','name','novalidate'],
    input: ['type','name','value','placeholder','checked','disabled','required','min','max','step','pattern','multiple','size','maxlength','minlength','readonly','autocomplete','id'],
    button: ['type','name','value','disabled','id'],
    select: ['name','multiple','disabled','required','id'],
    option: ['value','label','selected','disabled'],
    textarea: ['name','rows','cols','placeholder','maxlength','minlength','readonly','disabled','required','id','wrap'],
    label: ['for','id'],
    fieldset: ['disabled','name','id'],
    // Permitimos 'class', 'id' y atributos aria/data en todos para soporte de estilos/utilidad
    '*': ['class','id','data-*','aria-*']
  },
  // Permitimos data: para imágenes embebidas base64 si se requiere.
  allowedSchemes: ['http', 'https', 'mailto', 'data']
});

const sanitizeExcerpt = (html: string) => sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim();

@Injectable()
export class AdminPostsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll(authorId: string | undefined, page = 1, limit = 10, status?: PostStatus, extra?: { categorySlug?: string; tagSlug?: string; q?: string }) {
    const where: Prisma.PostWhereInput = authorId ? { authorId } : {};
  // Si se solicita explícitamente status lo aplicamos; de lo contrario, para listados de soporte (menú) puede interesar sólo publicados
  if (status) where.status = status; else where.status = 'PUBLISHED';
    if (extra?.q) {
      const term = extra.q.trim();
      if (term) {
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { content: { contains: term, mode: 'insensitive' } }
        ];
      }
    }
    if (extra?.categorySlug) {
      where.categories = { some: { category: { slug: extra.categorySlug } } };
    }
    if (extra?.tagSlug) {
      where.tags = { some: { tag: { slug: extra.tagSlug } } };
    }
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { categories: { include: { category: { select: { name: true, slug: true } } } }, tags: { include: { tag: { select: { name: true, slug: true } } } } }
      }),
  this.prisma.post.count({ where })
    ]);
    const items = rows.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      updatedAt: r.updatedAt,
      featuredImage: r.featuredImage,
      categories: r.categories.map(c => c.category),
      tags: r.tags.map(t => t.tag)
    }));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id }, include: { categories: { include: { category: true } }, tags: { include: { tag: true } } } });
    if (!post) throw new NotFoundException();
    return post;
  }

  async create(userId: string, data: { title: string; content: string; status: PostStatus; excerpt?: string; categories?: string[]; tags?: string[]; featuredImage?: string }) {
    const safeContent = sanitizeContent(data.content);
    const safeExcerpt = data.excerpt ? sanitizeExcerpt(data.excerpt) : undefined;
  const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const slug = `${slugBase}-${Date.now().toString(36)}`;
  const created = await this.prisma.post.create({
      data: {
        title: data.title,
    slug,
        content: safeContent,
        status: data.status,
        ...(safeExcerpt ? { excerpt: safeExcerpt } : {}),
        authorId: userId,
        readingTime: Math.max(1, Math.round(safeContent.split(/\s+/).length / 200)),
        version: 1,
        ...(data.featuredImage ? { featuredImage: data.featuredImage } : {}),
        categories: data.categories && data.categories.length ? {
          create: data.categories.map(slug => ({ category: { connect: { slug } } }))
        } : undefined,
        tags: data.tags && data.tags.length ? {
          create: data.tags.map(slug => ({ tag: { connect: { slug } } }))
        } : undefined
      }
    });
    await this.audit.log({ userId, action: 'CREATE', resource: 'Post', resourceId: created.id });
    return created;
  }

  async update(id: string, userId: string, data: { title?: string; content?: string; status?: PostStatus; excerpt?: string; categories?: string[]; tags?: string[]; featuredImage?: string | null }) {
  const existing = await this.prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true, version: true, featuredImage: true } });
    if (!existing) throw new NotFoundException();
    const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
    const isAdmin = actor?.roles.includes('ADMIN');
    if (!isAdmin && existing.authorId !== userId) throw new ForbiddenException();
  const safeContent = data.content ? sanitizeContent(data.content) : undefined;
  const safeExcerpt = data.excerpt ? sanitizeExcerpt(data.excerpt) : undefined;
    const replacingImage = data.featuredImage !== undefined && data.featuredImage !== existing.featuredImage;
    const oldImage = replacingImage ? existing.featuredImage : null;
    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(safeContent ? { content: safeContent } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(safeExcerpt !== undefined ? { excerpt: safeExcerpt } : {}),
        lastEditedBy: userId,
        lastEditedAt: new Date(),
        version: existing.version + 1,
        ...(data.featuredImage !== undefined ? { featuredImage: data.featuredImage } : {}),
        ...(data.categories ? { categories: { deleteMany: {}, create: data.categories.map(slug => ({ category: { connect: { slug } } })) } } : {}),
        ...(data.tags ? { tags: { deleteMany: {}, create: data.tags.map(slug => ({ tag: { connect: { slug } } })) } } : {})
      }
    });
    // Nota: Estrategia simple de cleanup: si se reemplaza imagen y la anterior es del dominio local /uploads/ eliminamos el archivo.
    if (oldImage && oldImage.startsWith('/uploads/')) {
      // best-effort, no bloquear respuesta si falla
      const localPath = oldImage.replace(/^\/uploads\//,'');
      import('path').then(path => {
        import('fs/promises').then(fs => {
          const p = path.join(process.cwd(), 'uploads', localPath);
          fs.unlink(p).catch(()=>undefined);
        });
      });
    }
    await this.audit.log({ userId, action: 'UPDATE', resource: 'Post', resourceId: id });
    return updated;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
    const isAdmin = actor?.roles.includes('ADMIN');
    if (!isAdmin && existing.authorId !== userId) throw new ForbiddenException();
    await this.prisma.post.delete({ where: { id } });
    await this.audit.log({ userId, action: 'DELETE', resource: 'Post', resourceId: id });
    return { deleted: true };
  }
}
