
import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs/operators';
import { SeoService } from '../../shared/seo.service';
import { PostDetailComponent } from '../post-detail/post-detail.component';
import { BlogListComponent } from '../blog/blog-list.component';
import { ThemeService } from '../../shared/theme.service';
import { DynamicHtmlRendererComponent } from '../../shared/dynamic-content/components/dynamic-html-renderer/dynamic-html-renderer.component';
import { ContentSkeletonComponent } from '../../shared/ui/content-skeleton/content-skeleton.component';
import { NotFoundStateComponent } from '../../shared/ui/not-found-state/not-found-state.component';
import { TwindService } from '../../shared/twind.service';

type ResolvedTypes = 'homepage' | 'page' | 'blog' | 'category' | 'post' | 'not_found';
interface PagePayload { id: string; title: string; content?: string; excerpt?: string; slug?: string; }
interface PostPayload { id: string; title: string; content?: string; excerpt?: string; slug: string; readingTime?: number; }
interface CategoryPayload { id: string; name: string; slug: string; }
interface BlogPayload { id?: string; title?: string; }
type AnyPayload = PagePayload | PostPayload | CategoryPayload | BlogPayload | Record<string, unknown> | undefined;
interface ResolveResponse { success: boolean; data: { type: ResolvedTypes; payload?: AnyPayload; context?: unknown }; }

@Component({
  standalone: true,
  selector: 'app-dynamic-public',
  imports: [CommonModule, RouterModule, PostDetailComponent, BlogListComponent, DynamicHtmlRendererComponent, ContentSkeletonComponent, NotFoundStateComponent],
  template: `
  <ng-template #loadingTpl>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[65vh]">
      <app-content-skeleton [variant]="(type() === 'post' ? 'post' : 'page')" />
    </div>
  </ng-template>
  @if (!loading()) {
  <section class="container-fluid site-shell min-h-[60vh]" #dynRoot>
    @switch (type()) {
    @case ('homepage') {
  <article>
    @if (contentString(); as html) {
      <app-dynamic-html-renderer [htmlContent]="html" (contentAnalyzed)="onContentAnalyzed($event)"></app-dynamic-html-renderer>
    } @else {
      <app-content-skeleton variant="page" />
    }
  </article>
      }
      @case ('page') {
  <article>
    @if (contentString(); as html) {
      <app-dynamic-html-renderer [htmlContent]="html" (contentAnalyzed)="onContentAnalyzed($event)"></app-dynamic-html-renderer>
    } @else {
      <app-content-skeleton variant="page" />
    }
  </article>
      }
      @case ('blog') {
        <app-blog-list
          mode="blog"
          [title]="blogTitle()"
          [basePath]="currentPath()"
        />
      }
      @case ('category') {
        <app-blog-list
          mode="category"
          [title]="categoryTitle()"
          [categorySlug]="categorySlug()"
          [basePath]="currentPath()"
        />
      }
      @case ('post') {
        <app-post-detail [slug]="postSlug()"></app-post-detail>
      }
      @default {
        <app-not-found-state />
      }
    }
  </section>
  } @else { <ng-container [ngTemplateOutlet]="loadingTpl"></ng-container> }
  `
})
export class DynamicPublicComponent implements AfterViewInit{
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  private sanitizer = inject(DomSanitizer);
  private twind = inject(TwindService);
  private fetchStart = 0;
  private readonly minSkeletonMs = 200;

  readonly loading = signal(true);
  readonly type = signal<string>('loading');
  readonly payload = signal<unknown | null>(null);
  readonly currentPath = signal<string>('');
  postSlug(): string | undefined { const v = this.p(); const s = v?.['slug']; return typeof s === 'string' ? s : undefined; }
  readonly safeContent = signal<SafeHtml | undefined>(undefined);
  readonly theme = inject(ThemeService);
  @ViewChild('dynRoot', { static: false }) dynRoot?: ElementRef<HTMLElement>;

  constructor() {
    this.route.url.pipe(
      takeUntilDestroyed(),
      tap(() => {
        // Mostrar skeleton en cada navegación mientras resolvemos el tipo y payload
        this.loading.set(true);
        this.type.set('loading');
        this.payload.set(null);
        this.fetchStart = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      }),
      switchMap(segments => {
        const path = segments.map(s => s.path).join('/');
        this.currentPath.set(path); // guardar ruta base para construir enlaces a detalle
        return this.http.get<ResolveResponse>(`/api/resolve`, { params: { path } });
      })
    ).subscribe({
      next: (res) => {
        this.endLoadingWithMinDelay();
        this.type.set(res.data.type || 'not_found');
  this.payload.set(res.data.payload || null);
  const payload: AnyPayload = res.data.payload;
  const html = (payload && typeof payload === 'object') ? (payload as Record<string, unknown>)['content'] : undefined;
  if (typeof html === 'string') this.safeContent.set(this.sanitizer.bypassSecurityTrustHtml(html));

          // Aplicar Twind a clases dentro del contenedor dinámico después de inyectar HTML
          queueMicrotask(async () => { try { await this.applyTwindNow(); } catch { /* empty */ } });

        setTimeout(() => {
            this.theme.forceStyleRefresh();
          }, 500);
        // SEO básico
        if (res.data.type === 'page' || res.data.type === 'homepage') {
          const p = payload as PagePayload;
          this.seo.set({ title: p.title, description: p.excerpt || p.content?.slice(0, 160) });
        } else if (res.data.type === 'post') {
          const p = payload as PostPayload;
          this.seo.set({ title: p.title, description: p.excerpt || p.content?.slice(0, 160), type: 'article' });
        } else if (res.data.type === 'not_found') {
          this.seo.set({ title: '404', description: 'Página no encontrada', robots: 'noindex, nofollow' });
        }
        // Listados ahora son responsabilidad de BlogListComponent
      },
      error: () => {
        this.endLoadingWithMinDelay();
        this.type.set('not_found');
        this.seo.set({ title: '404', description: 'Página no encontrada', robots: 'noindex, nofollow' });
      }
    });
  }
  p(): Record<string, unknown> | null {
    const v = this.payload();
    return (v && typeof v === 'object') ? v as Record<string, unknown> : null;
  }

  blogTitle(): string { const t = this.p()?.['title']; return typeof t === 'string' && t.trim() ? t : 'Blog'; }
  categoryTitle(): string { const n = this.p()?.['name']; const name = typeof n === 'string' ? n : ''; return `Categoría: ${name}`.trim(); }
  categorySlug(): string | undefined { const s = this.p()?.['slug']; return typeof s === 'string' ? s : undefined; }
  // Fallback de excerpt: si no hay excerpt, generar desde el contenido (limpio y truncado)
  async ngAfterViewInit() {
    const el = this.dynRoot?.nativeElement;
    if (el) this.theme.attachContainer(el);
    await this.applyTwindNow();
  }
  private async applyTwindNow() {
    const container = this.dynRoot?.nativeElement || document.body;
    await this.twind.applyToContainer(container);
  }

  contentString(): string {
    const obj = this.p();
    const v = obj ? obj['content'] : undefined;
    return typeof v === 'string' ? v : '';
  }

  onContentAnalyzed(meta: { title?: string; description?: string; headings?: string[] }) {
    const currentType = this.type();
    if (currentType === 'page' || currentType === 'homepage') {
      const p = this.payload() as PagePayload | undefined;
      if (p && (!p.excerpt || !p.excerpt.trim())) {
        this.seo.set({ title: p.title || meta.title || 'Página', description: meta.description });
      }
    } else if (currentType === 'post') {
      const p = this.payload() as PostPayload | undefined;
      if (p && (!p.excerpt || !p.excerpt.trim())) {
        this.seo.set({ title: p.title || meta.title || 'Post', description: meta.description, type: 'article' });
      }
    }
  }

  private endLoadingWithMinDelay() {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const elapsed = Math.max(0, now - this.fetchStart);
    const remaining = Math.max(0, this.minSkeletonMs - elapsed);
    if (remaining > 0) {
      setTimeout(() => this.loading.set(false), remaining);
    } else {
      this.loading.set(false);
    }
  }
}
