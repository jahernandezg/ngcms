
import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { SeoService } from '../../shared/seo.service';
import { unwrapData } from '../../shared/http-utils';
import { PostDetailComponent } from '../post-detail/post-detail.component';
import { ThemeService } from '../../shared/theme.service';
import { observeDynamicContainer } from '../../shared/twind-runtime';

type ResolvedTypes = 'homepage' | 'page' | 'blog' | 'category' | 'post' | 'not_found';
interface PagePayload { id: string; title: string; content?: string; excerpt?: string; slug?: string; }
interface PostPayload { id: string; title: string; content?: string; excerpt?: string; slug: string; readingTime?: number; }
interface CategoryPayload { id: string; name: string; slug: string; }
interface BlogPayload { id?: string; title?: string; }
type AnyPayload = PagePayload | PostPayload | CategoryPayload | BlogPayload | Record<string, unknown> | undefined;
interface ResolveResponse { success: boolean; data: { type: ResolvedTypes; payload?: AnyPayload; context?: unknown }; }
interface PostListItem { id: string; slug: string; title: string; excerpt?: string | null; readingTime?: number; publishedAt?: string | null; author?: { id: string; name: string }; categories?: { id?: string; name?: string; slug?: string }[] }
interface ApiListEnvelope<T> { success: boolean; message?: string; data: T[]; meta?: { total: number; page: number; limit: number; totalPages?: number } }

@Component({
  standalone: true,
  selector: 'app-dynamic-public',
  imports: [CommonModule, RouterModule, PostDetailComponent],
  template: `
  <ng-template #blogEmpty>
  @if (!loadingMore()) { <p class="text-text-secondary">(Sin publicaciones)</p> }
  </ng-template>
  <ng-template #catEmpty>
  @if (!loadingMore()) { <p class="text-text-secondary">(Sin publicaciones)</p> }
  </ng-template>
  <ng-template #loadingTpl>
    <p class="p-4">Cargando…</p>
  </ng-template>
  @if (!loading()) {
  <section class="container-fluid" #dynRoot>
    @switch (type()) {
    @case ('homepage') {
  <article class="prose" [innerHTML]="safeContent()"></article>
      }
      @case ('page') {
  <article class="prose" [innerHTML]="safeContent()"></article>
      }
      @case ('blog') {
        <div class="container mx-auto p-4">
  <h1 class="text-2xl font-semibold mb-4">{{ p()?.['title'] || 'Blog' }}</h1>
  @if (loadingMore() && page() === 1) { <div class="text-sm text-text-secondary mb-2">Cargando posts…</div> }
  @if (posts() && posts()?.length) {
    <div class="space-y-6">
      @for (post of posts()!; track post.id) {
      <article class="border-b pb-4 last:border-b-0">
        <h2 class="text-xl font-semibold leading-snug">
          <a [routerLink]="buildPostLink(post)" class="hover:underline">{{ post.title }}</a>
        </h2>
  <div class="text-xs text-text-secondary flex items-center gap-2 mt-1">
          @if (post.author) { <span>{{ post.author.name }}</span> }
          @if (post.publishedAt) { <span>· {{ post.publishedAt | date:'mediumDate' }}</span> }
          @if (post.readingTime) { <span>· {{ post.readingTime }} min</span> }
        </div>
  <p class="text-sm text-text-secondary mt-2 line-clamp-3">{{ getExcerpt(post) }}</p>
        @if (post.categories?.length) {
          <div class="mt-2 flex flex-wrap gap-1">
            @for (c of post.categories; track c.slug) {
              <a [routerLink]="['/', c.slug]" class="text-[11px] px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200"><span>#</span>{{ c.name }}</a>
            }
          </div>
        }
      </article>
      }
    </div>
  } @else { <ng-container [ngTemplateOutlet]="blogEmpty"></ng-container> }
        @if (hasMore() && !loadingMore()) {
          <button (click)="loadMore()" class="mt-4 px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50">Cargar más</button>
        }
        @if (loadingMore() && page() > 1) { <div class="text-sm text-text-secondary mt-2">Cargando…</div> }

        </div>
      }
      @case ('category') {
         <div class="container mx-auto p-4">
  <h1 class="text-2xl font-semibold mb-4">Categoría: {{ p()?.['name'] }}</h1>
  @if (loadingMore() && page() === 1) { <div class="text-sm text-text-secondary mb-2">Cargando posts…</div> }
  @if (posts() && posts()?.length) {
    <div class="space-y-6">
      @for (post of posts()!; track post.id) {
      <article class="border-b pb-4 last:border-b-0">
        <h2 class="text-xl font-semibold leading-snug">
          <a [routerLink]="buildPostLink(post)" class="hover:underline">{{ post.title }}</a>
        </h2>
  <div class="text-xs text-text-secondary flex items-center gap-2 mt-1">
          @if (post.author) { <span>{{ post.author.name }}</span> }
          @if (post.publishedAt) { <span>· {{ post.publishedAt | date:'mediumDate' }}</span> }
          @if (post.readingTime) { <span>· {{ post.readingTime }} min</span> }
        </div>
  <p class="text-sm text-text-secondary mt-2 line-clamp-3">{{ getExcerpt(post) }}</p>
        @if (post.categories?.length) {
          <div class="mt-2 flex flex-wrap gap-1">
            @for (c of post.categories; track c.slug) {
              <a [routerLink]="['/', c.slug]" class="text-[11px] px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200"><span>#</span>{{ c.name }}</a>
            }
          </div>
        }
      </article>
      }
    </div>
  } @else { <ng-container [ngTemplateOutlet]="catEmpty"></ng-container> }
        @if (hasMore() && !loadingMore()) {
          <button (click)="loadMore()" class="mt-4 px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50">Cargar más</button>
        }
        @if (loadingMore() && page() > 1) { <div class="text-sm text-text-secondary mt-2">Cargando…</div> }
        </div>
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
export class DynamicPublicComponent implements AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  readonly type = signal<string>('loading');
  readonly payload = signal<unknown | null>(null);
  readonly currentPath = signal<string>('');
  postSlug(): string | undefined { const v = this.p(); const s = v?.['slug']; return typeof s === 'string' ? s : undefined; }
  readonly posts = signal<PostListItem[] | null>(null);
  readonly totalPosts = signal<number>(0);
  readonly page = signal<number>(1);
  readonly limit = 20;
  readonly loadingMore = signal<boolean>(false);
  readonly safeContent = signal<SafeHtml | undefined>(undefined);
  readonly theme = inject(ThemeService);
  @ViewChild('dynRoot', { static: false }) dynRoot?: ElementRef<HTMLElement>;
  private disconnectTwind: (() => void) | null = null;

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

          // Reaplicar Twind después de actualizar el HTML dinámico
          queueMicrotask(() => { try { this.initTwind?.(); } catch {} });

        setTimeout(() => {
            console.log('Tailwind styles refreshed antes...');
            this.theme.forceStyleRefresh();
          }, 500);
        // SEO básico
        if (res.data.type === 'page' || res.data.type === 'homepage') {
          const p = payload as PagePayload;
          this.seo.set({ title: p.title, description: p.excerpt || p.content?.slice(0, 160) });
        } else if (res.data.type === 'post') {
          const p = payload as PostPayload;
          this.seo.set({ title: p.title, description: p.excerpt || p.content?.slice(0, 160), type: 'article' });
        } else if (res.data.type === 'category') {
          const p = payload as CategoryPayload;
          // canonical siempre igual a la ruta real, sea top-level o anidada
          const path = typeof window !== 'undefined' ? window.location.pathname : `/${p.slug}`;
          this.seo.set({ title: `Categoría: ${p.name}`, canonical: path });
        } else if (res.data.type === 'blog') {
          const path = typeof window !== 'undefined' ? window.location.pathname : '/';
          const bp = (payload as BlogPayload).title || 'Blog';
          this.seo.set({ title: bp, canonical: path });
        }
        // Cargar listados
        if (res.data.type === 'blog') {
          this.resetListingState();
          this.fetchBlogPosts();
        } else if (res.data.type === 'category') {
          const slug = (payload as CategoryPayload).slug;
          if (slug) { this.resetListingState(); this.fetchCategoryPosts(slug); }
        } else {
          this.posts.set(null);
          this.totalPosts.set(0);
          this.page.set(1);
        }
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

  private fetchBlogPosts() {
    const nextPage = this.page();
    this.loadingMore.set(true);
    this.http.get<ApiListEnvelope<PostListItem> | { data: PostListItem[]; meta?: { total: number } }>(`/api/posts`, { params: { limit: this.limit, page: nextPage } })
      .subscribe(r => {
        const current = this.posts() || [];
        const incoming = unwrapData<PostListItem[]>(r as unknown as ApiListEnvelope<PostListItem> | PostListItem[]);
        const metaTotal = (r as ApiListEnvelope<PostListItem>)?.meta?.total;
        this.posts.set(nextPage === 1 ? incoming : [...current, ...incoming]);
        this.totalPosts.set(metaTotal ?? (nextPage === 1 ? incoming.length : (current.length + incoming.length)));
        this.loadingMore.set(false);
      });
  }
  private fetchCategoryPosts(slug: string) {
    const nextPage = this.page();
    this.loadingMore.set(true);
    this.http.get<ApiListEnvelope<PostListItem> | { data: PostListItem[]; meta?: { total: number } }>(`/api/posts/category/${slug}`, { params: { limit: this.limit, page: nextPage } })
      .subscribe(r => {
        const current = this.posts() || [];
        const incoming = unwrapData<PostListItem[]>(r as unknown as ApiListEnvelope<PostListItem> | PostListItem[]);
        const metaTotal = (r as ApiListEnvelope<PostListItem>)?.meta?.total;
        this.posts.set(nextPage === 1 ? incoming : [...current, ...incoming]);
        this.totalPosts.set(metaTotal ?? (nextPage === 1 ? incoming.length : (current.length + incoming.length)));
        this.loadingMore.set(false);
      });
  }

  loadMore() {
    if (this.loadingMore()) return;
    const hasMore = (this.posts()?.length || 0) < this.totalPosts();
    if (!hasMore) return;
    this.page.set(this.page() + 1);
    if (this.type() === 'blog') this.fetchBlogPosts();
    else if (this.type() === 'category') {
      const cat = this.payload() as CategoryPayload;
      if (cat?.slug) this.fetchCategoryPosts(cat.slug);
    }
  }

  hasMore() { return (this.posts()?.length || 0) < this.totalPosts(); }
  private resetListingState() { this.posts.set([]); this.totalPosts.set(0); this.page.set(1); }

  buildPostLink(post: PostListItem) {
    // Si estamos en blog o categoría, anexar slug al path base; si no, root
    const base = this.currentPath().split('/').filter(Boolean);
    if (this.type() === 'blog' || this.type() === 'category') {
      return ['/', ...base, post.slug];
    }
    return ['/', post.slug];
  }
  // Fallback de excerpt: si no hay excerpt, generar desde el contenido (limpio y truncado)
  async ngAfterViewInit() { await this.initTwind(); }
  ngOnDestroy() { if (this.disconnectTwind) { try { this.disconnectTwind(); } catch {} this.disconnectTwind = null; } }
  private async initTwind() {
    const container = this.dynRoot?.nativeElement || document.body;
    if (this.disconnectTwind) { try { this.disconnectTwind(); } catch {} this.disconnectTwind = null; }
    this.disconnectTwind = await observeDynamicContainer(container);
  }

  getExcerpt(post: { excerpt?: string | null; content?: string | null }): string {
    if (post.excerpt && post.excerpt.trim()) return post.excerpt;
    if (post.content) {
      // Quitar HTML y truncar a 160 caracteres
      const tmp = document.createElement('div');
      tmp.innerHTML = post.content;
      const text = tmp.textContent || tmp.innerText || '';
      return text.trim().slice(0, 160) + (text.length > 160 ? '…' : '');
    }
    return '';
  }
}
