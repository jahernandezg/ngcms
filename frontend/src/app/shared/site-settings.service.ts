import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface SiteSettingsPublic {
  siteName: string;
  tagline?: string | null;
  defaultMetaDesc?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private http = inject(HttpClient);
  private settingsSig = signal<SiteSettingsPublic | null>(null);
  private loadingSig = signal(false);
  readonly settings = this.settingsSig.asReadonly();
  readonly loading = this.loadingSig.asReadonly();
  private fetched = false;

  load() {
    if (this.fetched || this.loading()) return; // evita duplicados
    this.loadingSig.set(true);
    this.http.get<SiteSettingsPublic>('/api/site-settings/public').subscribe({
      next: (s) => { this.settingsSig.set(s); this.fetched = true; this.loadingSig.set(false); },
      error: () => { this.loadingSig.set(false); }
    });
  }
}
