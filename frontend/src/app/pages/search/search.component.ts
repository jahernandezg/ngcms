import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, InjectionToken } from '@angular/core';
import { SeoService } from '../../shared/seo.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { unwrapData } from '../../shared/http-utils';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, filter } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

 type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  readingTime: number;
  publishedAt?: string | null;
  author: { id: string; name: string };
  categories: { id: string; name: string; slug: string }[];
};

 type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number; q: string };
};

export const SEARCH_DEBOUNCE_MS = new InjectionToken<number>('SEARCH_DEBOUNCE_MS');

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="container mx-auto p-4">
      <h1 class="text-2xl font-semibold mb-4">Buscar</h1>
      <input class="border p-2 w-full mb-4" placeholder="Buscar..." [value]="q()" (input)="onInput($event)"/>
  <div class="text-sm text-text-secondary mb-2" *ngIf="suggestions()?.titles?.length">Sugerencias: 
        <button *ngFor="let s of suggestions()?.titles" class="mr-2 underline" (click)="setQ(s)" [innerHTML]="highlight(s)"></button>
        <span *ngFor="let t of suggestions()?.tags" class="ml-2"><a [routerLink]="['/tag', t.slug]" class="underline">#{{ t.name }}</a></span>
      </div>
      <ng-container *ngIf="posts(); else loadingTpl">
        <p *ngIf="posts().length === 0">Sin resultados para "{{ q() }}".</p>
        <article *ngFor="let p of posts()" class="py-4 border-b">
          <h2 class="text-xl font-medium"><a [routerLink]="['/post', p.slug]" class="text-primary underline" [innerHTML]="highlight(p.title)"></a></h2>
          <p class="text-text-secondary" [innerHTML]="highlight(p.excerpt || '')"></p>
          <small class="text-text-secondary">Por {{ p.author.name }} · {{ p.readingTime }} min</small>
        </article>
        <nav class="flex gap-2 mt-4" *ngIf="totalPages() > 1">
          <button class="px-3 py-1 border rounded" [disabled]="page() === 1" (click)="prev()">Anterior</button>
          <span>Página {{ page() }} / {{ totalPages() }}</span>
          <button class="px-3 py-1 border rounded" [disabled]="page() >= totalPages()" (click)="next()">Siguiente</button>
        </nav>
      </ng-container>
      <ng-template #loadingTpl>
        <p>Cargando…</p>
      </ng-template>
    </section>
  `,
})
export class SearchComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seo = inject(SeoService);

  readonly q = signal('');
  readonly page = signal(1);
  readonly limit = 10;

  onInput(ev: Event) {
    const value = (ev.target as HTMLInputElement).value;
    this.q.set(value);
    this.page.set(1);
  }
  setQ(value: string) {
    this.q.set(value);
    this.page.set(1);
  }

  private debounceMs = inject(SEARCH_DEBOUNCE_MS, { optional: true }) ?? 200;
  private readonly q$ = (this.debounceMs > 0
    ? toObservable(this.q).pipe(debounceTime(this.debounceMs))
    : toObservable(this.q)
  ).pipe(
    distinctUntilChanged(),
    filter((q) => q.trim().length > 1)
  );
  private readonly page$ = toObservable(this.page).pipe(startWith(1));

  readonly suggestions = toSignal(
    this.q$.pipe(
      switchMap((q) =>
        this.http.get<{ titles: string[]; tags: { name: string; slug: string }[] }>(
          '/api/search/suggest',
          { params: new HttpParams().set('q', q) }
        )
      )
    )
  );

  readonly response = toSignal<(ApiListResponse<PostListItem> | PostListItem[]) | undefined>(
    combineLatest([this.q$, this.page$]).pipe(
      switchMap(([q, p]) =>
  this.http.get<ApiListResponse<PostListItem> | PostListItem[]>('/api/search', {
          params: new HttpParams().set('q', q).set('page', String(p)).set('limit', String(this.limit)),
        })
      )
    )
  );

  readonly posts = computed(() => {
    const r = this.response();
    return r ? unwrapData<PostListItem[]>(r as ApiListResponse<PostListItem> | PostListItem[]) : [];
  });
  readonly meta = computed(() => {
    const r = this.response() as ApiListResponse<PostListItem> | undefined;
    return r?.meta ?? { total: 0, page: 1, limit: this.limit, totalPages: 1, q: this.q() };
  });
  readonly totalPages = computed(() => this.meta().totalPages ?? 1);

  next() {
    if (this.page() < this.totalPages()) this.page.update((p) => p + 1);
  }
  prev() {
    if (this.page() > 1) this.page.update((p) => p - 1);
  }

  // Sincronización con query params (?q=...&page=...)
  private readonly queryParams = toSignal<{ q: string; page: number } | undefined>(
    this.route.queryParamMap.pipe(
      map((m) => ({ q: m.get('q') ?? '', page: Number(m.get('page') ?? '1') || 1 }))
    )
  );

  constructor() {
    // Reflejar ruta -> estado
    effect(() => {
      const qp = this.queryParams();
      if (!qp) return;
  // Solo sincronizar 'q' desde la ruta si el estado local aún está vacío, para no pisar entradas posteriores del usuario
  if (qp.q && qp.q !== this.q() && this.q().trim().length === 0) this.q.set(qp.q);
      if (qp.page !== this.page()) this.page.set(qp.page);
    });

    // Reflejar estado -> ruta (evitando loops)
    effect(() => {
      const current = this.queryParams();
      const q = this.q();
      const p = this.page();
      if (!current || current.q === q && current.page === p) return;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q, page: p !== 1 ? p : null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    // SEO dinámico según query
    effect(() => {
      const q = this.q().trim();
      this.seo.set({
        title: q ? `Buscar: ${q}` : 'Buscar',
        description: q ? `Resultados de búsqueda para ${q}` : 'Busca artículos por título o contenido',
        canonical: '/search' + (q ? `?q=${encodeURIComponent(q)}` : ''),
      });
    });
  }

  // Resaltado simple de términos
  private escapeHtml(s: string) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  highlight(text: string) {
    const q = (this.q() || '').trim();
    if (!q) return this.escapeHtml(text);
    const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${pattern})`, 'ig');
    return this.escapeHtml(text).replace(re, '<mark>$1</mark>');
  }
}
