import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { unwrapData, type ApiEnvelope } from './http-utils';

export interface SiteSettingsPublic {
  siteName: string;
  tagline?: string | null;
  defaultMetaDesc?: string | null;
  logoUrl?: string | null; // fallback (logoLight)
  faviconUrl?: string | null;
  // Branding extendido
  logoLight?: string | null;
  logoDark?: string | null;
  siteUrl?: string | null;
  ogImage?: string | null;
  defaultPostImage?: string | null;
  analyticsId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private settingsSig = signal<SiteSettingsPublic | null>(null);
  private loadingSig = signal(false);
  readonly settings = this.settingsSig.asReadonly();
  readonly loading = this.loadingSig.asReadonly();
  private fetched = false;

  load() {
    // Evita petición en SSR para no bloquear rendering ni necesitar proxy
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.fetched || this.loading()) return; // evita duplicados
    this.loadingSig.set(true);
    // Mapea BlogConfig público a SiteSettingsPublic
  this.http.get<unknown>('/api/blog-config').subscribe({
      next: (s) => {
        type BlogConfigPublic = {
          blogName: string;
          description?: string | null;
          siteUrl?: string | null;
          logoLight?: string | null; logoDark?: string | null; favicon?: string | null; ogImage?: string | null; defaultPostImage?: string | null;
          metaDescription?: string | null;
          analyticsId?: string | null;
    };
    const cfg = unwrapData<BlogConfigPublic>(s as ApiEnvelope<BlogConfigPublic>);
        const mapped: SiteSettingsPublic = {
          siteName: cfg.blogName,
          tagline: cfg.description ?? null,
          defaultMetaDesc: cfg.metaDescription ?? null,
          logoUrl: cfg.logoLight ?? cfg.logoDark ?? null,
          faviconUrl: cfg.favicon ?? null,
          logoLight: cfg.logoLight ?? null,
          logoDark: cfg.logoDark ?? null,
          siteUrl: cfg.siteUrl ?? null,
          ogImage: cfg.ogImage ?? null,
          defaultPostImage: cfg.defaultPostImage ?? null,
          analyticsId: cfg.analyticsId ?? null,
        };
        this.settingsSig.set(mapped); this.fetched = true; this.loadingSig.set(false);
      },
      error: () => { this.loadingSig.set(false); }
    });
  }
}
