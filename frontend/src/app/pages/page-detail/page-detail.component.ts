import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  @if (page()) {
    <section class="container mx-auto p-4">
    <div [innerHTML]="safeContent()"></div>
    </section>
    <script type="application/ld+json" [textContent]="jsonLd()"></script>
  } @else {
    <p class="p-4">Cargando…</p>
  }
  `,
})
export class PageDetailComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  private sanitizer = inject(DomSanitizer);

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
  readonly safeContent = toSignal<SafeHtml | undefined>(this.data$.pipe(
    map(p => p?.content ? this.sanitizer.bypassSecurityTrustHtml(p.content) : undefined)
  ));

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
