import { inject, Injectable, effect } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { SiteSettingsService } from './site-settings.service';
import { buildAssetUrl } from './asset-url.util';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleSrv = inject(Title);
  private meta = inject(Meta);
  private settingsSvc = inject(SiteSettingsService);
  private siteName = 'CMS';
  private canonicalBase = (typeof window !== 'undefined' && (window as unknown as { SITE_URL?: string }).SITE_URL) || '';

  constructor() {
    // efecto reactivo: cuando se cargan settings actualiza siteName
    effect(() => {
      const s = this.settingsSvc.settings();
      if (s?.siteName) this.siteName = s.siteName;
    });
  }

  /**
   * Establece metadatos SEO y sociales.
   * Prioridad de imagen (og:image / twitter:image):
   * 1) opts.image (por ejemplo featuredImage del post)
   * 2) settings.defaultPostImage
   * 3) settings.ogImage
   */
  set(opts: { title?: string; description?: string; canonical?: string; type?: string; image?: string; robots?: string }) {
    const settings = this.settingsSvc.settings();
    const baseTitle = settings?.siteName || this.siteName;
    const fullTitle = opts.title ? `${opts.title} | ${baseTitle}` : baseTitle;
    this.titleSrv.setTitle(fullTitle);
    // description fallback
    const descSource = opts.description || settings?.defaultMetaDesc || settings?.tagline || undefined;
    if (descSource) {
      const desc = this.truncate(descSource, 160);
      this.meta.updateTag({ name: 'description', content: desc });
      this.meta.updateTag({ property: 'og:description', content: desc });
      this.meta.updateTag({ name: 'twitter:description', content: desc });
    }
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:type', content: opts.type || 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    // og:image: prioridad a opts.image > defaultPostImage > ogImage (para coherencia de marca en posts)
  const ogRaw = opts.image || settings?.defaultPostImage || settings?.ogImage || undefined;
  const og = buildAssetUrl(ogRaw || null) || undefined;
    if (og) {
      this.meta.updateTag({ property: 'og:image', content: og });
      this.meta.updateTag({ name: 'twitter:image', content: og });
    }
    // site_name
    if (baseTitle) {
      this.meta.updateTag({ property: 'og:site_name', content: baseTitle });
    }
    if (opts.canonical) {
      this.setCanonical(opts.canonical);
    }
    if (opts.robots) {
      this.meta.updateTag({ name: 'robots', content: opts.robots });
    }
  }

  private setCanonical(path: string) {
    if (typeof document === 'undefined') return; // SSR: se omitirá canonical, será añadido en fase cliente
    const href = path.startsWith('http') ? path : this.canonicalBase ? this.canonicalBase.replace(/\/$/, '') + path : path;
    let link: HTMLLinkElement | null = document.querySelector('link[rel=canonical]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private truncate(s: string, max: number) {
    if (!s) return '';
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '…';
  }
}
