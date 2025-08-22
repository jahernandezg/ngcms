
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { SeoService } from '../../shared/seo.service';
import { PostDetailComponent } from '../post-detail/post-detail.component';

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
    <p class="text-gray-500" *ngIf="!loadingMore()">(Sin publicaciones)</p>
  </ng-template>
  <ng-template #catEmpty>
    <p class="text-gray-500" *ngIf="!loadingMore()">(Sin publicaciones)</p>
  </ng-template>
  <ng-template #loadingTpl>
    <p class="p-4">Cargando…</p>
  </ng-template>
  <section class="container mx-auto p-4" *ngIf="!loading(); else loadingTpl">
  <!-- Templates de vacío ya definidos arriba; se removieron duplicados -->
    <ng-container [ngSwitch]="type()">
      <ng-container *ngSwitchCase="'homepage'">
  <h1 class="text-3xl font-semibold mb-4">{{ p()?.['title'] }}</h1>
  <article class="prose" [innerHTML]="p()?.['content']"></article>
      </ng-container>
      <ng-container *ngSwitchCase="'page'">
  <h1 class="text-3xl font-semibold mb-4">{{ p()?.['title'] }}</h1>
  <article class="prose" [innerHTML]="p()?.['content']"></article>
      </ng-container>
      <ng-container *ngSwitchCase="'blog'">
  <h1 class="text-2xl font-semibold mb-4">{{ p()?.['title'] || 'Blog' }}</h1>
    <div *ngIf="loadingMore() && page() === 1" class="text-sm text-gray-500 mb-2">Cargando posts…</div>
  <div *ngIf="posts() && posts()?.length; else blogEmpty" class="space-y-6">
      <article *ngFor="let post of posts()" class="border-b pb-4 last:border-b-0">
        <h2 class="text-xl font-semibold leading-snug">
          <a [routerLink]="buildPostLink(post)" class="hover:underline">{{ post.title }}</a>
        </h2>
        <div class="text-xs text-gray-500 flex items-center gap-2 mt-1">
          <span *ngIf="post.author">{{ post.author.name }}</span>
          <span *ngIf="post.publishedAt">· {{ post.publishedAt | date:'mediumDate' }}</span>
          <span *ngIf="post.readingTime">· {{ post.readingTime }} min</span>
        </div>
  <p class="text-sm text-gray-700 mt-2 line-clamp-3">{{ getExcerpt(post) }}</p>
        <div class="mt-2 flex flex-wrap gap-1" *ngIf="post.categories?.length">
          <a *ngFor="let c of post.categories" [routerLink]="['/', c.slug]" class="text-[11px] px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200"><span>#</span>{{ c.name }}</a>
        </div>
      </article>
    </div>
  <!-- blogEmpty template moved outside -->
        <button *ngIf="hasMore() && !loadingMore()" (click)="loadMore()" class="mt-4 px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50">Cargar más</button>
        <div *ngIf="loadingMore() && page() > 1" class="text-sm text-gray-500 mt-2">Cargando…</div>
      </ng-container>
      <ng-container *ngSwitchCase="'category'">
  <h1 class="text-2xl font-semibold mb-4">Categoría: {{ p()?.['name'] }}</h1>
    <div *ngIf="loadingMore() && page() === 1" class="text-sm text-gray-500 mb-2">Cargando posts…</div>
  <div *ngIf="posts() && posts()?.length; else catEmpty" class="space-y-6">
      <article *ngFor="let post of posts()" class="border-b pb-4 last:border-b-0">
        <h2 class="text-xl font-semibold leading-snug">
          <a [routerLink]="buildPostLink(post)" class="hover:underline">{{ post.title }}</a>
        </h2>
        <div class="text-xs text-gray-500 flex items-center gap-2 mt-1">
          <span *ngIf="post.author">{{ post.author.name }}</span>
          <span *ngIf="post.publishedAt">· {{ post.publishedAt | date:'mediumDate' }}</span>
          <span *ngIf="post.readingTime">· {{ post.readingTime }} min</span>
        </div>
  <p class="text-sm text-gray-700 mt-2 line-clamp-3">{{ getExcerpt(post) }}</p>
 
        <div class="mt-2 flex flex-wrap gap-1" *ngIf="post.categories?.length">
          <a *ngFor="let c of post.categories" [routerLink]="['/', c.slug]" class="text-[11px] px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200"><span>#</span>{{ c.name }}</a>
        </div>
      </article>
    </div>
  <!-- catEmpty template moved outside -->
        <button *ngIf="hasMore() && !loadingMore()" (click)="loadMore()" class="mt-4 px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50">Cargar más</button>
        <div *ngIf="loadingMore() && page() > 1" class="text-sm text-gray-500 mt-2">Cargando…</div>
      </ng-container>
      <ng-container *ngSwitchCase="'post'">
        <app-post-detail [slug]="postSlug()"></app-post-detail>
      </ng-container>
      <ng-container *ngSwitchDefault>
        <h1 class="text-2xl font-semibold mb-4">404</h1>
        <p>No encontrado.</p>
      </ng-container>
    </ng-container>
  </section>
  `
})
export class DynamicPublicComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  private router = inject(Router);

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

  constructor(){
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
        // SEO básico
        const payload: AnyPayload = res.data.payload;
        if (res.data.type === 'page' || res.data.type === 'homepage') {
          const p = payload as PagePayload;
          this.seo.set({ title: p.title, description: p.excerpt || p.content?.slice(0,160) });
        } else if (res.data.type === 'post') {
          const p = payload as PostPayload;
          this.seo.set({ title: p.title, description: p.excerpt || p.content?.slice(0,160), type: 'article' });
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

  private fetchBlogPosts(){
    const nextPage = this.page();
    this.loadingMore.set(true);
    this.http.get<ApiListEnvelope<PostListItem>>(`/api/posts`, { params: { limit: this.limit, page: nextPage } })
      .subscribe(r => {
        const current = this.posts() || [];
        const incoming = r.data || [];
        this.posts.set(nextPage === 1 ? incoming : [...current, ...incoming]);
        this.totalPosts.set(r.meta?.total ?? (nextPage === 1 ? incoming.length : (current.length + incoming.length)));
        this.loadingMore.set(false);
      });
  }
  private fetchCategoryPosts(slug: string){
    const nextPage = this.page();
    this.loadingMore.set(true);
    this.http.get<ApiListEnvelope<PostListItem>>(`/api/posts/category/${slug}`, { params: { limit: this.limit, page: nextPage } })
      .subscribe(r => {
        const current = this.posts() || [];
        const incoming = r.data || [];
        this.posts.set(nextPage === 1 ? incoming : [...current, ...incoming]);
        this.totalPosts.set(r.meta?.total ?? (nextPage === 1 ? incoming.length : (current.length + incoming.length)));
        this.loadingMore.set(false);
      });
  }

  loadMore(){
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
  private resetListingState(){ this.posts.set([]); this.totalPosts.set(0); this.page.set(1); }

  buildPostLink(post: PostListItem){
    // Si estamos en blog o categoría, anexar slug al path base; si no, root
    const base = this.currentPath().split('/').filter(Boolean);
    if (this.type() === 'blog' || this.type() === 'category') {
      return ['/', ...base, post.slug];
    }
    return ['/', post.slug];
  }
  // Fallback de excerpt: si no hay excerpt, generar desde el contenido (limpio y truncado)
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
