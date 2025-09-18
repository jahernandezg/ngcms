import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { MenuItemType } from '@prisma/client';

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';
}

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  listPublic() {
  type MenuItemBase = Awaited<ReturnType<typeof this.prisma.menuItem.findMany>>[number];
  type MenuItemWithSlug = MenuItemBase & { slug: string };
  return this.prisma.menuItem.findMany({ where: { isVisible: true }, orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }], select: { id:true,title:true,url:true,type:true,targetId:true,parentId:true,sortOrder:true,isVisible:true,openNewWindow:true,createdAt:true,updatedAt:true,slug:true } }).then(async items => {
  const pageIds = items.filter(i => i.type === 'PAGE' && i.targetId).map(i => i.targetId as string);
  const catIds = items.filter(i => i.type === 'CATEGORY' && i.targetId).map(i => i.targetId as string);
  const postIds = items.filter(i => i.type === 'POST' && i.targetId).map(i => i.targetId as string);
      const [pages, cats, posts] = await Promise.all([
        pageIds.length ? this.prisma.page.findMany({ where: { id: { in: pageIds } }, select: { id: true, slug: true, isHomepage: true } }) : Promise.resolve([]),
        catIds.length ? this.prisma.category.findMany({ where: { id: { in: catIds } }, select: { id: true, slug: true } }) : Promise.resolve([]),
        postIds.length ? this.prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, slug: true } }) : Promise.resolve([]),
      ]);
      const pageMap = new Map(pages.map(p => [p.id, { slug: p.slug, isHomepage: p.isHomepage }] as const));
      const catMap = new Map(cats.map(c => [c.id, c.slug] as const));
      const postMap = new Map(posts.map(p => [p.id, p.slug] as const));
      // Construir mapa para path ascendente
      const byId = new Map(items.map(i => [i.id, i] as const));
  const buildPath = (item: MenuItemWithSlug): string[] => {
        const segs: string[] = [];
        let current: MenuItemWithSlug | undefined = item;
        while (current) {
          if (current.slug) {
            // si este item apunta (directa o indirectamente) a la homepage y es tipo PAGE con target homepage => no añadir
            if (current.type === 'PAGE' && current.targetId) {
              const pm = pageMap.get(current.targetId);
              if (pm?.isHomepage) {
                // no agregar este slug ni continuar agregando hacia arriba (root)
                current = current.parentId ? byId.get(current.parentId) : undefined;
                // seguimos para permitir remover slug pero evaluar ancestros (por si definieras contenedores antes de homepage, inusual)
                continue;
              }
            }
            segs.unshift(current.slug);
          }
          if (!current.parentId) break;
          current = byId.get(current.parentId);
        }
        return segs;
      };
      return items.map(i => {
        let targetId = i.targetId;
        if (i.type === 'PAGE' && i.targetId && pageMap.has(i.targetId)) {
          const v = pageMap.get(i.targetId);
          if (v) targetId = v.slug;
        } else if (i.type === 'CATEGORY' && i.targetId && catMap.has(i.targetId)) {
          const v = catMap.get(i.targetId);
          if (v) targetId = v;
        } else if (i.type === 'POST' && i.targetId && postMap.has(i.targetId)) {
          const v = postMap.get(i.targetId);
          if (v) targetId = v;
        }
        return { ...i, targetId, pathSegments: buildPath(i) };
      });
    });
  }

  listAdmin() { return this.prisma.menuItem.findMany({ orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }] }); }

  create(data: { title: string; type: MenuItemType; url?: string; targetId?: string; parentId?: string; sortOrder?: number; isVisible?: boolean; openNewWindow?: boolean; slug?: string }) {
    const { parentId, slug, ...rest } = data;
    const finalSlug = slug ? slugify(slug) : slugify(data.title);
    const payload = { ...rest, parentId: parentId ?? null, slug: finalSlug };
    return this.prisma.menuItem.create({ data: payload });
  }

  update(id: string, data: Partial<{ title: string; type: MenuItemType; url?: string; targetId?: string; parentId?: string; sortOrder?: number; isVisible?: boolean; openNewWindow?: boolean; slug?: string }>) {
    const { parentId, slug, title, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };
    if (parentId !== undefined) payload.parentId = parentId ?? null;
    if (slug) payload.slug = slugify(slug);
    else if (title) payload.slug = slugify(title); // opcionalmente regenerar si cambia título y no se definió slug
    return this.prisma.menuItem.update({ where: { id }, data: payload });
  }

  remove(id: string) { return this.prisma.menuItem.delete({ where: { id } }); }

  async reorder(order: { id: string; sortOrder: number; parentId?: string | null }[]) {
    return this.prisma.$transaction(order.map(o => this.prisma.menuItem.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder, parentId: o.parentId ?? null } })));
  }

  async resolvePath(rawPath: string) {
    const clean = rawPath.replace(/^\/+/g, '').replace(/\/+$/g, '');
    if (!clean) {
      // homepage
      const homepage = await this.prisma.page.findFirst({ where: { isHomepage: true, status: 'PUBLISHED' }, select: { id: true, title: true, slug: true, excerpt: true, content: true } });
      if (homepage) return { type: 'homepage', payload: homepage };
      return { type: 'not_found' };
    }
    const segments = clean.split('/').filter(Boolean);
    const items = await this.prisma.menuItem.findMany({ where: { isVisible: true }, orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }], select: { id:true,title:true,url:true,type:true,targetId:true,parentId:true,sortOrder:true,isVisible:true,openNewWindow:true,createdAt:true,updatedAt:true,slug:true } });
    // map id->item
    const byId = new Map(items.map(i => [i.id, i] as const));
    const buildPath = (item: typeof items[number]): string[] => {
      const segs: string[] = [];
      let current: typeof items[number] | undefined = item;
      while (current) {
        segs.unshift(current.slug);
        if (!current.parentId) break;
        current = byId.get(current.parentId);
      }
      return segs;
    };
    const withPaths = items.map(i => ({ item: i, path: buildPath(i) }));
    const pathKey = (p: string[]) => p.join('/');
    // exact longest prefix search
    let bestMatch: { item: typeof items[number]; path: string[] } | null = null;
    for (const candidate of withPaths) {
      if (candidate.path.length === 0) continue;
      if (candidate.path.length > segments.length) continue;
      if (pathKey(candidate.path) === pathKey(segments.slice(0, candidate.path.length))) {
        if (!bestMatch || candidate.path.length > bestMatch.path.length || (candidate.path.length === bestMatch.path.length && this.priority(candidate.item.type) < this.priority(bestMatch.item.type))) {
          bestMatch = candidate;
        }
      }
    }
    if (bestMatch && bestMatch.path.length === segments.length) {
      // exact match
      return await this.resolveExactItem(bestMatch.item);
    }
    if (bestMatch) {
      // leftover segments -> assume post slug last
      const postSlug = segments[segments.length - 1];
  const post = await this.prisma.post.findFirst({ where: { slug: postSlug, status: 'PUBLISHED' }, select: { id: true, slug: true, title: true, excerpt: true, featuredImage: true, content: true, readingTime: true, publishedAt: true } });
      if (post) {
        return { type: 'post', payload: post, context: { baseType: bestMatch.item.type } };
      }
    }
    // fallback direct page/category/post by slug (legacy)
    // Si la ruta es de 1 segmento, buscar categoría por slug y devolver tipo category
    if (segments.length === 1) {
      const category = await this.prisma.category.findFirst({ where: { slug: segments[0] }, select: { id: true, slug: true, name: true } });
      if (category) return { type: 'category', payload: category };
    }
    const page = await this.prisma.page.findFirst({ where: { slug: segments[segments.length - 1], status: 'PUBLISHED' }, select: { id: true, slug: true, title: true, excerpt: true, content: true } });
    if (page) return { type: 'page', payload: page };
    const category = await this.prisma.category.findFirst({ where: { slug: segments[segments.length - 1] }, select: { id: true, slug: true, name: true } });
    if (category) return { type: 'category', payload: category };
  const post = await this.prisma.post.findFirst({ where: { slug: segments[segments.length - 1], status: 'PUBLISHED' }, select: { id: true, slug: true, title: true, excerpt: true, featuredImage: true, content: true, readingTime: true, publishedAt: true } });
    if (post) return { type: 'post', payload: post };
    return { type: 'not_found' };
  }

  private priority(type: string) {
    // menor valor = mayor prioridad
    switch (type) {
      case 'PAGE': return 0;
      case 'CATEGORY': return 1;
      case 'BLOG_INDEX': return 2;
      default: return 5;
    }
  }

  private async resolveExactItem(item: { type: string; targetId?: string | null; slug: string; title?: string }) {
    if (item.type === 'PAGE' && item.targetId) {
      const page = await this.prisma.page.findUnique({ where: { slug: item.targetId }, select: { id: true, slug: true, title: true, excerpt: true, content: true } });
      if (page) return { type: 'page', payload: page };
    } else if (item.type === 'CATEGORY' && item.targetId) {
      const cat = await this.prisma.category.findUnique({ where: { slug: item.targetId }, select: { id: true, slug: true, name: true } });
      if (cat) return { type: 'category', payload: cat };
    } else if (item.type === 'BLOG_INDEX') {
  return { type: 'blog', payload: { slug: item.slug, title: item.title || 'Blog' } };
    }
    return { type: 'not_found' };
  }
}
