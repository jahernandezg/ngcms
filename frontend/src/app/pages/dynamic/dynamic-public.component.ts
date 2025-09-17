
import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { SeoService } from '../../shared/seo.service';
import { PostDetailComponent } from '../post-detail/post-detail.component';
import { BlogListComponent } from '../blog/blog-list.component';
import { ThemeService } from '../../shared/theme.service';
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
  imports: [CommonModule, RouterModule, PostDetailComponent, BlogListComponent],
  template: `
  <ng-template #loadingTpl>
    <p class="p-4">Cargando…</p>
  </ng-template>
  @if (!loading()) {
  <section class="container-fluid site-shell" #dynRoot>
    @switch (type()) {
    @case ('homepage') {
  <article [innerHTML]="safeContent()"></article>
      }
      @case ('page') {
  <article  [innerHTML]="safeContent()"></article>
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
        <h1 class="text-2xl font-semibold mb-4">404</h1>
        <p>No encontrado.</p>
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
      switchMap(segments => {
        const path = segments.map(s => s.path).join('/');
        this.currentPath.set(path); // guardar ruta base para construir enlaces a detalle
        return this.http.get<ResolveResponse>(`/api/resolve`, { params: { path } });
      })
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
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
        }
        // Listados ahora son responsabilidad de BlogListComponent
      },
      error: () => {
        this.loading.set(false);
        this.type.set('not_found');
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
}
