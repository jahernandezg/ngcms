import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ActiveTheme {
  id: string; name: string; primaryColor?: string | null; secondaryColor?: string | null; customCss?: string | null; settings?: unknown; isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);
  private loadingSig = signal(false);
  private themeSig = signal<ActiveTheme | null>(null);
  readonly loading = this.loadingSig.asReadonly();
  readonly theme = this.themeSig.asReadonly();
  private appliedCssId = 'active-theme-inline';
  private darkModeSig = signal<boolean>(false);
  readonly darkMode = this.darkModeSig.asReadonly();
  private userPreferenceSet = false; // true si el usuario hizo toggle manual
  private mediaQueryList: MediaQueryList | null = null;

  load() {
    if (this.loading()) return;
    // Evita cargar tema en área admin (solo público) salvo preview explícito ?theme=
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const preview = this.readPreviewId();
      if (!preview && path.startsWith('/admin')) return; // no aplica tema público dentro del admin
    }
    // Cache previa
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('activeTheme');
      if (cached) {
        try { 
          const raw = JSON.parse(cached);
          // Detectar si cache antiguo guardó envelope {success,data}
          const fromCache: ActiveTheme | null = raw && raw.id ? raw : (raw && raw.data && raw.data.id ? raw.data : null);
          if (fromCache) { this.themeSig.set(fromCache); this.applyToDocument(fromCache); }
        } catch { /* ignore cache parse */ }
      }
      const darkPref = localStorage.getItem('darkMode');
      if (darkPref !== null) {
        this.darkModeSig.set(darkPref === 'true');
        this.userPreferenceSet = true;
      } else {
        this.initSystemListener();
      }
      this.applyDarkMode();
    } else {
      this.initSystemListener();
      this.applyDarkMode();
    }
    this.loadingSig.set(true);
    const previewId = this.readPreviewId();
    const url = previewId ? `/api/admin/themes/${previewId}` : '/api/theme/active';
  this.http.get<unknown>(url).subscribe({
      // Respuesta real llega como envelope { success, message, data }
      next: (raw) => {
        let theme: ActiveTheme | null = null;
        const isActiveTheme = (v: unknown): v is ActiveTheme => !!v && typeof v === 'object' && 'id' in v && 'name' in v;
        const isEnvelope = (v: unknown): v is { data: unknown } => !!v && typeof v === 'object' && 'data' in v;
        if (isActiveTheme(raw)) theme = raw;
        else if (isEnvelope(raw) && isActiveTheme(raw.data)) theme = raw.data;
        this.themeSig.set(theme);
        if (theme && typeof localStorage !== 'undefined' && !previewId) {
          try { localStorage.setItem('activeTheme', JSON.stringify(theme)); } catch { /* ignore cache save */ }
        }
        this.applyToDocument(theme || undefined);
        this.loadingSig.set(false);
      },
      error: () => { this.loadingSig.set(false); }
    });
  }

  toggleDarkMode() {
    this.darkModeSig.set(!this.darkModeSig());
    this.userPreferenceSet = true;
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('darkMode', String(this.darkModeSig())); } catch { /* ignore persist error */ }
    }
    this.applyDarkMode();
  }

  private initSystemListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkModeSig.set(this.mediaQueryList.matches);
    const handler = (e: MediaQueryListEvent) => {
      if (this.userPreferenceSet) return; // respeta preferencia manual
      this.darkModeSig.set(e.matches);
      this.applyDarkMode();
    };
    try { this.mediaQueryList.addEventListener('change', handler); } catch { /* Safari legacy */ this.mediaQueryList.addListener(handler); }
  }

  private applyDarkMode() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (body && !body.classList.contains('theme-transition')) {
      body.classList.add('theme-transition');
      setTimeout(() => body.classList.remove('theme-transition'), 400);
    }
    if (this.darkModeSig()) {
      // Usa sólo clase .dark (Tailwind v4 darkMode: 'class')
      root.classList.add('dark');
      body.classList.add('dark-mode');
      body.setAttribute('data-dark-indicator','dark');
    } else {
  root.classList.remove('dark');
      body.classList.remove('dark-mode');
      body.removeAttribute('data-dark-indicator');
    }
    this.ensureColorSchemeMeta();
  }

  private ensureColorSchemeMeta() {
    if (typeof document === 'undefined') return;
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name','color-scheme');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', this.darkModeSig() ? 'dark light' : 'light dark');
  }

  private readPreviewId(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('theme');
  }

  private applyToDocument(theme?: ActiveTheme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme?.id) root.setAttribute('data-theme-id', theme.id); else root.removeAttribute('data-theme-id');
    if (theme?.primaryColor) root.style.setProperty('--color-primary', theme.primaryColor);
    if (theme?.secondaryColor) root.style.setProperty('--color-secondary', theme.secondaryColor);
    // Variables adicionales opcionales si vienen en settings (ej: { bg:"#...", text:"#..." })
    if (theme?.settings && typeof theme.settings === 'object') {
      const allowedMap: Record<string,string> = {
        bg: '--color-bg',
        text: '--color-text',
        surface: '--color-surface',
        surfaceAlt: '--color-surface-alt',
        border: '--color-border'
      };
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = theme.settings as any;
        Object.keys(allowedMap).forEach(k => {
          const v = s[k];
          if (typeof v === 'string' && v.trim()) root.style.setProperty(allowedMap[k], v.trim());
        });
      } catch { /* noop */ }
    }
    const existing = document.getElementById(this.appliedCssId);
    if (existing) existing.remove();
    if (theme?.customCss) {
      const styleEl = document.createElement('style');
      styleEl.id = this.appliedCssId;
      // Evita que reglas :root del tema anulen las variables en modo oscuro (.dark)
      const transformed = theme.customCss.replace(/:root\b/g, ':root:not(.dark)');
      styleEl.textContent = transformed;
      document.head.appendChild(styleEl);
    }
  }
}
