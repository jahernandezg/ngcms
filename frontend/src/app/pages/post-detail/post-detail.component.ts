import { CommonModule, Location } from '@angular/common';
import { Component, inject, effect, Input, signal, DestroyRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeoService } from '../../shared/seo.service';
import { unwrapData } from '../../shared/http-utils';

type PostDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  readingTime: number;
  publishedAt?: string | null;
  viewCount: number;
  author: { id: string; name: string; avatarUrl?: string | null; bio?: string | null };
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
};

interface ApiEnvelope<T> { success: boolean; message?: string; data: T }
interface ApiListEnvelope<T> { success: boolean; message?: string; data: T[] }

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  @if (!loading()) {
    <section class="container mx-auto p-4">
      <h1 class="text-3xl font-semibold mb-2">{{ post()?.title }}</h1>
      <small class="text-text-secondary">Por {{ post()?.author?.name }} · {{ post()?.readingTime }} min</small>
      <div class="flex flex-wrap gap-2 my-2">
        @for (c of post()?.categories; track c.id) {
          <a [routerLink]="['/', c.slug]" class="text-xs px-2 py-1 bg-gray-100 rounded">#{{ c.name }}</a>
        }
        @for (t of post()?.tags; track t.id) {
          <span class="text-xs px-2 py-1 bg-gray-50 rounded">{{ t.name }}</span>
        }
      </div>
  <article class="prose mt-4" [innerHTML]="safeContent()"></article>
      @if (related()?.length) {
        <section class="mt-10">
          <h3 class="text-xl font-semibold mb-2">Relacionados</h3>
          <ul class="list-disc pl-5">
            @for (r of related(); track r.id) {
              <li>
                <a [routerLink]="['/', r.slug]" class="text-primary underline">{{ r.title }}</a>
              </li>
            }
          </ul>
        </section>
      }
      <nav class="mt-6">
        <a [attr.href]="backHref" (click)="goBack($event)" class="text-primary underline">Volver</a>
      </nav>
    </section>
    <script type="application/ld+json" [textContent]="jsonLd()"></script>
  } @else {
    <p class="p-4">Cargando…</p>
  }
  `,
})
export class PostDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  private _slugInput?: string;
  @Input() set slug(value: string | undefined) {
    this._slugInput = value;
    if (value && value !== this.slugSignal()) {
      this.slugSignal.set(value);
    }
  }
  get slug(): string | undefined { return this._slugInput; }
  private readonly slugSignal = signal<string>('');
  readonly post = signal<PostDetail | undefined>(undefined);
  readonly safeContent = signal<SafeHtml | undefined>(undefined);
  readonly related = signal<PostDetail[] | undefined>(undefined);
  readonly loading = signal<boolean>(true);

  private _initial?: Partial<PostDetail> | null;
  @Input() set initial(value: Partial<PostDetail> | null | undefined) {
    this._initial = value || null;
    if (value && !this.post()) {
      // semilla inicial para evitar parpadeo
      this.post.set(value as PostDetail);
      this.loading.set(false);
    }
  }
  get initial() { return this._initial; }

  constructor() {
    // Observa paramMap si no hay slug por input
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(pm => {
      if (this.slug) return;
      const v = pm.get('slug');
      if (v) this.slugSignal.set(v);
    });
    // Reaccionar a cambios de slug
    effect(() => {
      const s = this.slugSignal();
      if (!s) return;
  this.fetchPost(s);
  this.fetchRelated(s);
    });
    // SEO
    effect(() => {
      const p = this.post();
      if (!p) return;
      const path = typeof window !== 'undefined' ? window.location.pathname : `/${p.slug}`;
  const desc = p.excerpt || this.truncate(p.content, 160);
  this.seo.set({ title: p.title, description: desc, type: 'article', canonical: path });
    });
  }

  private fetchPost(slugOrId: string) {
    this.loading.set(true);
    this.http.get<ApiEnvelope<PostDetail> | PostDetail>(`/api/posts/${slugOrId}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => {
        const data: PostDetail | undefined = unwrapData<PostDetail>(r as unknown as ApiEnvelope<PostDetail> | PostDetail);
        if (data) {
          // Si viene escapado (&lt; en vez de <) lo decodificamos una sola vez
          const decodeIfNeeded = (html: string) => {
            if (!html) return html;
            if (html.includes('<') && !html.includes('&lt;')) return html; // parece normal
         if (html.includes('&lt;') && !html.includes('<')) {
              return html
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
           .replace(/&quot;/g, '"')
           .replace(/&#39;/g, "'");
            }
            return html;
          };
          data.content = decodeIfNeeded(data.content);
          this.post.set(data as PostDetail);
          this.safeContent.set(this.sanitizer.bypassSecurityTrustHtml(data.content));
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }
  private fetchRelated(slug: string) {
    this.http.get<ApiListEnvelope<PostDetail> | PostDetail[]>(`/api/posts/${slug}/related`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      const data = Array.isArray(r) ? (r as PostDetail[]) : unwrapData<PostDetail[]>(r as unknown as ApiListEnvelope<PostDetail> | PostDetail[]);
      if (data) this.related.set(data);
    });
  }

  goBack(ev: Event) {
    ev.preventDefault();
    // Preferimos historial; si no, ruta padre; si no, raíz
    const hasHistory = window.history.length > 1;
    if (hasHistory) {
      this.location.back();
      return;
    }
    const parent = this.computeParentPath();
    if (parent) {
      this.router.navigateByUrl(parent);
    } else {
      this.router.navigate(['/']);
    }
  }

  // Href mostrado en el enlace (sin interferir con SPA si se hace click)
  get backHref(): string {
    const parent = this.computeParentPath();
    return parent || '/';
  }

  private computeParentPath(): string | null {
    const url = this.router.url.split('?')[0];
    const segments = url.split('/').filter(Boolean);
    if (segments.length > 1) {
      const parentSegs = segments.slice(0, -1);
      return '/' + parentSegs.join('/');
    }
    return null;
  }

  // JSON-LD Article
  readonly jsonLd = () => {
    const p = this.post();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: p?.title || '',
      description: p?.excerpt || '',
      author: p ? { '@type': 'Person', name: p.author?.name } : undefined,
      url,
      datePublished: p?.publishedAt || undefined,
    };
    return JSON.stringify(data);
  };

  private truncate(s: string, max: number) {
    if (!s) return '';
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '…';
  }
}
