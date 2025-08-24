import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { SeoService } from '../../shared/seo.service';
import { unwrapData } from '../../shared/http-utils';

type PageDetail = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  seo?: { title?: string; description?: string; canonical?: string; keywords?: string };
  updatedAt?: string;
};

type ApiItemResponse<T> = { success: boolean; message: string; data: T };

@Component({
  selector: 'app-page-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <section class="container mx-auto p-4" *ngIf="page(); else loadingTpl">
    <h1 class="text-3xl font-semibold mb-4">{{ page()?.title }}</h1>
    <article class="prose" [innerHTML]="page()?.content"></article>
    <nav class="mt-8">
  <a routerLink="/" class="text-primary underline">Inicio</a>
    </nav>
  </section>
  <script type="application/ld+json" [textContent]="jsonLd()"></script>
  <ng-template #loadingTpl>
    <p class="p-4">Cargando…</p>
  </ng-template>
  `,
})
export class PageDetailComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private seo = inject(SeoService);

  private readonly data$ = this.route.paramMap.pipe(
    map(m => m.get('slug') || ''),
    switchMap(slug => this.http.get<ApiItemResponse<PageDetail> | PageDetail>(`/api/pages/${slug}`)),
    map(res => {
      const p = unwrapData<PageDetail>(res as unknown as ApiItemResponse<PageDetail> | PageDetail);
      if (p && p.content) {
        if (!p.content.includes('<') && p.content.includes('&lt;')) {
          p.content = p.content
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        }
      }
      return p;
    })
  );
  readonly page = toSignal<PageDetail | undefined>(this.data$);

  constructor() {
    effect(() => {
      const p = this.page();
      if (!p) return;
      const seo = p.seo || {};
      this.seo.set({ title: seo.title || p.title, description: seo.description || p.excerpt || p.content, canonical: seo.canonical });
    });
  }

  readonly jsonLd = () => {
    const p = this.page();
    if (!p) return '';
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: p.title,
      description: p.seo?.description || p.excerpt || '',
      url,
      dateModified: p.updatedAt || undefined,
    };
    return JSON.stringify(data);
  };
}
