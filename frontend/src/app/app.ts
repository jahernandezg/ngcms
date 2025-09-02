import { Component, OnInit, inject, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SiteSettingsService } from './shared/site-settings.service';
import { Meta } from '@angular/platform-browser';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  standalone : true,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'frontend';
  private siteSettings = inject(SiteSettingsService);
  private meta = inject(Meta);
  // actualiza favicon cuando settings cambian
  constructor(){
    effect(() => {
      const fav = this.siteSettings.settings()?.faviconUrl || null;
      if (typeof document !== 'undefined' && fav) {
        let link: HTMLLinkElement | null = document.querySelector('link[rel="icon"]');
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.type = fav.endsWith('.ico') ? 'image/x-icon' : 'image/png';
        link.href = fav;
      }
    });
    // Inyecta GA4 cuando haya analyticsId y aún no esté cargado
    effect(() => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      const id = this.siteSettings.settings()?.analyticsId || null;
      if (!id) return;
      if (document.getElementById('ga4-script')) return;
      const s1 = document.createElement('script');
      s1.async = true; s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; s1.id = 'ga4-script';
      document.head.appendChild(s1);
      const s2 = document.createElement('script');
      s2.id = 'ga4-inline';
      s2.text = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${id}');`;
      document.head.appendChild(s2);
    });

    // Inyecta JSON-LD global (Organization y WebSite) cuando haya SiteSettings
    effect(() => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      const s = this.siteSettings.settings();
      if (!s) return;
      const baseUrl = s.siteUrl || window.location.origin;
      const logo = s.logoUrl || s.logoLight || s.logoDark || undefined;

      // Organization
      if (!document.getElementById('ld-org')) {
        const org = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: s.siteName,
          url: baseUrl,
          logo: logo ? { '@type': 'ImageObject', url: logo } : undefined,
        } as const;
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'ld-org';
        script.text = JSON.stringify(org);
        document.head.appendChild(script);
      }

      // WebSite
      if (!document.getElementById('ld-website')) {
        const webSite = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: s.siteName,
          url: baseUrl,
        } as const;
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'ld-website';
        script.text = JSON.stringify(webSite);
        document.head.appendChild(script);
      }
    });
  }
  ngOnInit() {
    this.siteSettings.load();
  }
}
