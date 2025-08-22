import { inject, Injectable, effect } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { SiteSettingsService } from './site-settings.service';

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

  set(opts: { title?: string; description?: string; canonical?: string; type?: string }) {
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
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    if (opts.canonical) {
      this.setCanonical(opts.canonical);
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
