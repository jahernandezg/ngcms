import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { SeoService } from '../../shared/seo.service';
import { unwrapData } from '../../shared/http-utils';

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
  meta: { total: number; page: number; limit: number; totalPages: number; tag: string };
};

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="container mx-auto p-4">
      <h1 class="text-2xl font-semibold mb-4">Tag: {{ slug() }}</h1>
      <ng-container *ngIf="posts(); else loadingTpl">
        <article *ngFor="let p of posts()" class="py-4 border-b">
          <h2 class="text-xl font-medium"><a [routerLink]="['/post', p.slug]" class="text-primary underline">{{ p.title }}</a></h2>
          <p class="text-text-secondary">{{ p.excerpt }}</p>
          <small class="text-text-secondary">Por {{ p.author.name }} · {{ p.readingTime }} min</small>
        </article>
        <nav class="flex gap-2 mt-4">
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
export class TagComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  readonly page = signal(1);
  readonly limit = 10;

  readonly slug = toSignal(this.route.paramMap.pipe(map((m) => m.get('slug') || '')));
  private readonly page$ = toObservable(this.page);
  private readonly slug$ = this.route.paramMap.pipe(map((m) => m.get('slug') || ''));

  readonly response = toSignal<(ApiListResponse<PostListItem> | PostListItem[]) | undefined>(
  combineLatest([this.slug$, this.page$]).pipe(
      switchMap(([slug, p]) =>
  this.http.get<ApiListResponse<PostListItem> | PostListItem[]>(`/api/tag/${slug}`, {
          params: new HttpParams().set('page', String(p)).set('limit', String(this.limit)),
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
    return r?.meta ?? { total: 0, page: 1, limit: this.limit, totalPages: 1, tag: this.slug() };
  });
  readonly totalPages = computed(() => this.meta().totalPages ?? 1);

  next() {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
    }
  }

  prev() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
    }
  }

  // SEO
  constructor() {
    effect(() => {
      const slug = this.slug();
      if (!slug) return;
      this.seo.set({
        title: `Tag: ${slug}`,
        description: `Artículos etiquetados con ${slug}`,
        canonical: `/tag/${slug}`,
      });
    });
  }
}
