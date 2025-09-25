import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, Location } from '@angular/common';
import { Component, inject, effect, Input, signal, DestroyRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeoService } from '../../shared/seo.service';
import { TwindService } from '../../shared/twind.service';
import { unwrapData } from '../../shared/http-utils';
import { SiteSettingsService } from '../../shared/site-settings.service';
import { ShareButtonDirective } from 'ngx-sharebuttons';
import { SocialLinksComponent } from '../../shared/social-links/social-links.component';
import { PostImageComponent } from '../../shared/post-image.component';
import { DynamicHtmlRendererComponent } from '../../shared/dynamic-content/components/dynamic-html-renderer/dynamic-html-renderer.component';
import { ContentSkeletonComponent } from '../../shared/ui/content-skeleton/content-skeleton.component';
import { buildAssetUrl } from '../../shared/asset-url.util';
import { DynamicContentContextService } from '../../shared/dynamic-content/services/dynamic-content-context.service';

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
  featuredImage?: string | null;
};

interface ApiEnvelope<T> { success: boolean; message?: string; data: T }
interface ApiListEnvelope<T> { success: boolean; message?: string; data: T[] }

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ShareButtonDirective, FontAwesomeModule, SocialLinksComponent, PostImageComponent, DynamicHtmlRendererComponent, ContentSkeletonComponent],
  templateUrl: './post-detail.component.html',
})
export class PostDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);
  private twind = inject(TwindService);
  private siteSettings = inject(SiteSettingsService);
  private dynCtx = inject(DynamicContentContextService);



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
  // URL absoluta del post para compartir en redes
  readonly absoluteUrl = signal<string>('');
  // Estado al copiar enlace
  readonly copied = signal<boolean>(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;
  // Progreso de lectura (0-100) y minutos restantes
  readonly readingProgress = signal<number>(0);
  readonly remainingMinutes = signal<number>(0);
  private readingListenersAttached = false;

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
    // SEO (incluye imagen priorizando featuredImage)
    effect(() => {
      const p = this.post();
      if (!p) return;
      // Exponer el slug actual al sistema dinámico
      this.dynCtx.setPostSlug(p.slug);
      const path = typeof window !== 'undefined' ? window.location.pathname : `/${p.slug}`;
      const desc = p.excerpt || this.truncate(p.content, 160);
      const settings = this.siteSettings.settings();
  const rawImage = p.featuredImage || settings?.defaultPostImage || settings?.ogImage || undefined;
  const image = buildAssetUrl(rawImage || null) || undefined;
  this.seo.set({ title: p.title, description: desc, type: 'article', canonical: path, image });
    });
    // Inicializar minutos restantes al cargar el post
    effect(() => {
      const p = this.post();
      if (!p) return;
      this.remainingMinutes.set(Math.max(0, Math.ceil(p.readingTime ?? 0)));
      // recalcular progreso tras cambios de contenido
      queueMicrotask(() => this.computeReadingProgress());
    });
    // Calcular URL absoluta para compartir
    effect(() => {
      // Dependencias reactivas: post y slug
      const p = this.post();
      const slug = this.slugSignal();
      if (!p && !slug) return;
      try {
        if (typeof window !== 'undefined' && window.location) {
          // En navegador usamos la URL actual completa (incluye dominio y path)
          this.absoluteUrl.set(window.location.href);
          return;
        }
      } catch { /* noop */ }
      // Fallback SSR: construir con siteUrl (si existe) y la ruta/slug
      const base = (this.siteSettings.settings()?.siteUrl || '').replace(/\/$/, '');
      const currentPath = (this.router.url || '').split('?')[0];
      const path = currentPath && currentPath !== '/' ? currentPath : `/${p?.slug || slug}`;
      this.absoluteUrl.set(base ? `${base}${path}` : path);
    });
    // Re-aplicar Twind cuando cambia el contenido seguro
    effect(() => {
      void this.safeContent();
      queueMicrotask(async () => {
        try { await this.twind.applyToContainer(this.getContentRoot()); } catch { /* noop */ }
        // iniciar/actualizar listeners de lectura y recomputar
        this.initReadingProgressMonitoring();
        this.computeReadingProgress();
      });
    });
  }

  private getContentRoot(): Element | undefined {
    // Si tu template tiene un contenedor específico, preferimos aplicarlo allí; fallback a body
    const el = (document.querySelector('app-post-detail article') as Element | null) ?? undefined;
    return el ?? document.body;
  }

  // Copiar enlace al portapapeles y mostrar feedback
  copyLink(ev?: Event) {
    if (ev) ev.preventDefault();
    const url = this.absoluteUrl();
    if (!url) return;
    const done = () => {
      // resetear temporizador previo si existe
      if (this.copyTimer) { clearTimeout(this.copyTimer); this.copyTimer = null; }
      this.copied.set(true);
      this.copyTimer = setTimeout(() => {
        this.copied.set(false);
        this.copyTimer = null;
      }, 2000);
      // limpiar al destruir para no filtrar timers
      this.destroyRef.onDestroy(() => {
        if (this.copyTimer) clearTimeout(this.copyTimer);
      });
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        void navigator.clipboard.writeText(url).then(done).catch(() => this.fallbackCopy(url, done));
      } else {
        this.fallbackCopy(url, done);
      }
    } catch {
      this.fallbackCopy(url, done);
    }
  }

  private fallbackCopy(text: string, onFinish: () => void) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      onFinish();
    } catch {
      // si falla, no hacemos nada más
    }
  }

  private initReadingProgressMonitoring() {
    if (this.readingListenersAttached) return;
    if (typeof window === 'undefined') return;
    const onScrollOrResize = () => this.computeReadingProgress();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    this.readingListenersAttached = true;
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    });
  }

  private computeReadingProgress() {
    try {
      const article = document.querySelector('app-post-detail article') as HTMLElement | null;
      if (!article) return;
      const start = article.offsetTop;
      const end = start + article.offsetHeight - window.innerHeight;
      const current = window.scrollY;
      let pct = 0;
      if (end > start) {
        pct = ((current - start) / (end - start)) * 100;
      } else {
        // artículo más corto que el viewport
        pct = current >= start ? 100 : 0;
      }
      pct = Math.max(0, Math.min(100, pct));
      this.readingProgress.set(Math.round(pct));
      const total = this.post()?.readingTime ?? 0;
      const remaining = Math.max(0, Math.ceil(total * (1 - pct / 100)));
      this.remainingMinutes.set(remaining);
    } catch { /* noop */ }
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

  getPostImage(): string {
    const p = this.post() as (ReturnType<typeof this.post> & { featuredImage?: string }) | null;
    return p?.featuredImage || this.siteSettings.settings()?.defaultPostImage || this.siteSettings.settings()?.ogImage || 'https://placehold.co/800x450?text=Sin+Imagen';
  }

  getAuthorInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getTagClasses(index: number): string {
    const colors = [
      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
      'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    ];
    return colors[index % colors.length] + ' px-3 py-1 rounded-full text-sm';
  }

  onContentAnalyzed(meta: { title?: string; description?: string }) {
    const p = this.post();
    if (!p) return;
    if (!p.excerpt || !p.excerpt.trim()) {
      // actualizar solo la descripción manteniendo título y demás metadatos previos
      this.seo.set({ title: p.title, description: meta.description || this.truncate(p.content, 160), type: 'article' });
    }
  }
}
