import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { SeoService } from '../../shared/seo.service';

interface PostListItem { id: string; title: string; slug: string; excerpt?: string | null; readingTime: number; publishedAt?: string | null; author: { id: string; name: string } }
interface ApiList<T> { success: boolean; message: string; data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }

@Component({
  selector: 'app-author',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  template: `
    <section class="container mx-auto p-4">
      <h1 class="text-2xl font-semibold mb-4">Autor: {{ authorId() }}</h1>
      @if (posts()) {
        @for (p of posts(); track p.id) {
          <article class="py-4 border-b">
            <h2 class="text-xl font-medium"><a [routerLink]="['/post', p.slug]" class="text-primary underline">{{ p.title }}</a></h2>
            @if (p.excerpt) { <p class="text-text-secondary">{{ p.excerpt }}</p> }
            <small class="text-text-secondary">{{ p.readingTime }} min · {{ p.publishedAt | date:'mediumDate' }}</small>
          </article>
        }
        @if (totalPages() > 1) {
          <nav class="flex gap-2 mt-4">
            <button class="px-3 py-1 border rounded" [disabled]="page() === 1" (click)="prev()">Anterior</button>
            <span>Página {{ page() }} / {{ totalPages() }}</span>
            <button class="px-3 py-1 border rounded" [disabled]="page() >= totalPages()" (click)="next()">Siguiente</button>
          </nav>
        }
      } @else {
        <p>Cargando…</p>
      }
    </section>
  `,
})
export class AuthorComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private seo = inject(SeoService);

  readonly authorId = toSignal(this.route.paramMap.pipe(map(m => m.get('id') || '')));
  readonly page = signal(1);
  readonly limit = 10;
  private readonly page$ = toObservable(this.page);

  readonly response = toSignal<ApiList<PostListItem> | undefined>(
    this.route.paramMap.pipe(
      map(m => m.get('id') || ''),
      switchMap(id => this.page$.pipe(
        switchMap(p => this.http.get<ApiList<PostListItem>>(`/api/author/${id}` ,{ params: new HttpParams().set('page', String(p)).set('limit', String(this.limit)) }))
      ))
    )
  );

  readonly posts = computed(() => this.response()?.data ?? []);
  readonly meta = computed(() => this.response()?.meta ?? { total: 0, page: 1, limit: this.limit, totalPages: 1 });
  readonly totalPages = computed(() => this.meta().totalPages ?? 1);

  next() { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }
  prev() { if (this.page() > 1) this.page.update(p => p - 1); }

  constructor() {
    effect(() => {
      const id = this.authorId();
      if (!id) return;
      this.seo.set({ title: `Autor ${id}`, description: `Artículos publicados por el autor ${id}`, canonical: `/author/${id}` });
    });
  }
}
