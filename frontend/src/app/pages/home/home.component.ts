import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SeoService } from '../../shared/seo.service';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs/operators';
import { HomeDataService } from './home-data.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="container mx-auto p-4">
      <!-- Modo Página Home (sin cambiar la URL) -->
      <ng-container *ngIf="homepage(); else blogTpl">
        <h1 class="text-3xl font-semibold mb-4">{{ homepage()?.title }}</h1>
        <article class="prose" [innerHTML]="homepage()?.content"></article>
      </ng-container>
      <ng-template #blogTpl>
        <h1 class="text-2xl font-semibold mb-4">Últimos posts</h1>
        <ng-container *ngIf="!svc.loading(); else loadingTpl">
          <article *ngFor="let p of svc.items()" class="py-4 border-b">
            <h2 class="text-xl font-medium"><a [routerLink]="['/post', p.slug]" class="text-blue-600 underline">{{ p.title }}</a></h2>
            <p class="text-gray-600">{{ p.excerpt }}</p>
            <div class="flex flex-wrap gap-2 my-2" *ngIf="p.categories as cats">
              <a *ngFor="let c of cats" [routerLink]="['/category', c.slug]" class="text-xs px-2 py-1 bg-gray-100 rounded">#{{ c.name }}</a>
            </div>
            <div class="flex flex-wrap gap-2 my-2" *ngIf="p.tags?.length">
              <a *ngFor="let t of p.tags" [routerLink]="['/tag', t.slug]" class="text-xs px-2 py-1 bg-blue-50 rounded">{{ t.name }}</a>
            </div>
            <small class="text-gray-500">Por {{ p.author.name }} · {{ p.readingTime }} min</small>
          </article>
          @if(!svc.loading() && !svc.error() && svc.items().length === 0){
            <p class="text-gray-500">No hay posts publicados todavía.</p>
          }
          <nav class="flex gap-2 mt-4">
            <button class="px-3 py-1 border rounded" [disabled]="svc.page() === 1 || svc.loading()" (click)="svc.prev()">Anterior</button>
            <span>Página {{ svc.page() }} / {{ svc.totalPages() }}</span>
            <button class="px-3 py-1 border rounded" [disabled]="svc.page() >= svc.totalPages() || svc.loading()" (click)="svc.next()">Siguiente</button>
          </nav>
        </ng-container>
        <ng-template #loadingTpl>
          <p *ngIf="svc.loading()">Cargando…</p>
          <p *ngIf="!svc.loading() && svc.error()" class="text-red-600">{{ svc.error() }}</p>
        </ng-template>
      </ng-template>
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

  // Página marcada como home (si existe)
  readonly homepage = signal<PageDetail | null>(null);
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
    this.http.get<Envelope<PageDetail | null>>('/api/pages/homepage').subscribe({
      next: (res) => {
        if (res?.data) {
          this.homepage.set(res.data);
          this.homepageLoaded = true;
          const seo = res.data.seo || {};
          this.seo.set({
            title: seo.title || res.data.title,
            description: seo.description || res.data.excerpt || 'Página de inicio',
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
interface Envelope<T> { success: boolean; data: T; }
