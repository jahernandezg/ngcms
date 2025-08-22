import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  readingTime: number;
  publishedAt?: string | null;
  author: { id: string; name: string };
  categories: { id: string; name: string; slug: string }[];
  tags?: { id: string; name: string; slug: string }[];
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

@Injectable({ providedIn: 'root' })
export class HomeDataService {
  private http = inject(HttpClient);
  readonly limit = 10;
  private pageSig = signal(1);
  private itemsSig = signal<PostListItem[]>([]);
  private metaSig = signal<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: this.limit,
    totalPages: 1,
  });
  private loadingSig = signal(false);
  private errorSig = signal<string | null>(null);
  readonly page = this.pageSig.asReadonly();
  readonly items = this.itemsSig.asReadonly();
  readonly meta = this.metaSig.asReadonly();
  readonly loading = this.loadingSig.asReadonly();
  readonly error = this.errorSig.asReadonly();
  readonly totalPages = computed(() => this.meta().totalPages || 1);
  // Sin constructor: no side effects.
  private fetch(page: number, opts?: { skipCache?: boolean }) {
    this.loadingSig.set(true);
    this.errorSig.set(null);
    const headers = opts?.skipCache ? new HttpHeaders({ 'x-skip-cache': '1' }) : undefined;
    this.http.get<ApiListResponse<PostListItem>>('/api/posts', {
      params: new HttpParams().set('page', page.toString()).set('limit', this.limit.toString()),
      headers,
    }).subscribe({
      next: (res) => {
        // noop condicional si variable global de modo test existiera (evita referencia directa a símbolo inexistente)
        if ((globalThis as Record<string, unknown>)['ngJestMode'] !== undefined) { /* noop */ }
        this.itemsSig.set(res.data);
        this.metaSig.set(res.meta);
        this.loadingSig.set(false);
      },
      error: (err: unknown) => {
  // Silenciado en tests y runtime; pendiente integrar logger centralizado
        this.loadingSig.set(false);
        this.errorSig.set((err as Error)?.message || 'Error');
      },
    });
  }

  // Carga explícita inicial o manual
  load(opts?: { skipCache?: boolean }) {
    this.fetch(this.page(), opts);
  }

  next() {
    if (this.page() < this.totalPages()) {
      this.pageSig.update((p) => p + 1);
  this.fetch(this.page());
    }
  }

  prev() {
    if (this.page() > 1) {
      this.pageSig.update((p) => p - 1);
      this.fetch(this.page());
    }
  }

  setPage(p: number) {
    if (Number.isFinite(p) && p >= 1 && p !== this.page()) {
      this.pageSig.set(Math.floor(p));
      this.fetch(this.page());
    }
  }

  refreshHard() {
    this.pageSig.set(1);
    this.fetch(1, { skipCache: true });
  }
}
