import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal, DestroyRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { SeoService } from '../../shared/seo.service';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs/operators';
import { HomeDataService } from './home-data.service';
import { HttpClient } from '@angular/common/http';
import { unwrapData } from '../../shared/http-utils';
import { ThemeService } from '../../shared/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section>
      <!-- Modo Página Home (sin cambiar la URL) -->
      @if (homepage()) {
  <article [innerHTML]="safeHomeContent()"></article>
      } @else {
        <h1 class="text-2xl font-semibold mb-4">Últimos posts</h1>
        @if (!svc.loading()) {
          @for (p of svc.items(); track p.id) {
          <article class="py-4 border-b">
            <h2 class="text-xl font-medium"><a [routerLink]="['/post', p.slug]" class="text-primary underline">{{ p.title }}</a></h2>
            <p class="text-text-secondary">{{ p.excerpt }}</p>
            @if (p.categories; as cats) {
              <div class="flex flex-wrap gap-2 my-2">
                @for (c of cats; track c.slug) {
                  <a [routerLink]="['/category', c.slug]" class="text-xs px-2 py-1 bg-gray-100 rounded">#{{ c.name }}</a>
                }
              </div>
            }
            @if (p.tags?.length) {
              <div class="flex flex-wrap gap-2 my-2">
                @for (t of p.tags!; track t.slug) {
                  <a [routerLink]="['/tag', t.slug]" class="text-xs px-2 py-1 border border-border-app rounded text-text-secondary">{{ t.name }}</a>
                }
              </div>
            }
            <small class="text-text-secondary">Por {{ p.author.name }} · {{ p.readingTime }} min</small>
          </article>
          }
          @if(!svc.loading() && !svc.error() && svc.items().length === 0){
            <p class="text-text-secondary">No hay posts publicados todavía.</p>
          }
          <nav class="flex gap-2 mt-4">
            <button class="px-3 py-1 border rounded" [disabled]="svc.page() === 1 || svc.loading()" (click)="svc.prev()">Anterior</button>
            <span>Página {{ svc.page() }} / {{ svc.totalPages() }}</span>
            <button class="px-3 py-1 border rounded" [disabled]="svc.page() >= svc.totalPages() || svc.loading()" (click)="svc.next()">Siguiente</button>
          </nav>
        } @else {
          @if (svc.loading()) { <p>Cargando…</p> }
          @if (!svc.loading() && svc.error()) { <p class="text-red-600">{{ svc.error() }}</p> }
        }
      }
    </section>
  `,
})
export class HomeComponent implements OnInit {
  readonly svc = inject(HomeDataService);
  private seo = inject(SeoService);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);
  private theme = inject(ThemeService);

  // Página marcada como home (si existe)
  readonly homepage = signal<PageDetail | null>(null);
  readonly safeHomeContent = signal<SafeHtml | undefined>(undefined);
  private homepageLoaded = false; // ya se cargó homepage (éxito)
  private blogLoaded = false; // evita cargas duplicadas de posts

  ngOnInit() {
    // Estado inicial manual (evitamos duplicidad con la suscripción)
    const initialWantBlog = this.route.snapshot.queryParamMap.get('view') === 'blog';
    if (initialWantBlog) {
      this.enterBlogMode();
    } else {
      this.tryLoadHomepageOrBlogFallback();
    }

    // Cambios posteriores en query params (saltamos primera emisión)
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef), skip(1))
      .subscribe(q => {
        const wantBlog = q.get('view') === 'blog';
        if (wantBlog) {
          this.enterBlogMode();
        } else {
          // Volver a homepage si existe; si nunca se cargó, intentar ahora
          if (!this.homepageLoaded) {
            this.tryLoadHomepageOrBlogFallback();
          }
        }
      });
  }

  private loadBlogAndSeo() {
    if (!this.blogLoaded && isPlatformBrowser(this.platformId)) {
      this.svc.load();
      this.blogLoaded = true;
    }
  this.seo.set({ title: 'Inicio', description: 'Últimos artículos publicados', canonical: '/' });
  }

  private tryLoadHomepageOrBlogFallback() {
  this.http.get<unknown>('/api/pages/homepage').subscribe({
      next: (res) => {
    const data = unwrapData<PageDetail | null>(res as unknown as { data: PageDetail | null } | PageDetail | null);
        if (data) {
          this.homepage.set(data);
          this.safeHomeContent.set(this.sanitizer.bypassSecurityTrustHtml(data.content));
          this.homepageLoaded = true;
          const seo = data.seo || {};
          this.seo.set({
            title: seo.title || data.title,
            description: seo.description || data.excerpt || 'Página de inicio',
            canonical: '/',
          });
        } else {
          this.enterBlogMode();
        }
      },
      error: () => this.enterBlogMode()
    });
  }

  private enterBlogMode() {
    if (this.homepage()) this.homepage.set(null);
    this.loadBlogAndSeo();
  }
}

// Tipos auxiliares
interface PageDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  seo?: { title?: string; description?: string; canonical?: string; keywords?: string };
}
// Envelope tipado se maneja vía unwrapData
