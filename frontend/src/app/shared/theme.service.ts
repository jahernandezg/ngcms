import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ActiveTheme {
  id: string;
  name: string;
  isActive: boolean;
  
  // Colors
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  surfaceColor?: string | null;
  surfaceAltColor?: string | null;
  textColor?: string | null;
  textSecondary?: string | null;
  borderColor?: string | null;
  errorColor?: string | null;
  successColor?: string | null;
  warningColor?: string | null;
  
  // Typography
  fontHeading?: string | null;
  fontBody?: string | null;
  fontSizeBase?: string | null;
  fontScaleRatio?: number | null;
  lineHeightBase?: number | null;
  letterSpacing?: string | null;
  
  // Layout
  containerWidth?: string | null;
  spacingUnit?: string | null;
  borderRadius?: string | null;
  borderWidth?: string | null;
  
  // Style enums (as strings in the interface)
  headerStyle?: string | null;
  footerStyle?: string | null;
  buttonStyle?: string | null;
  cardStyle?: string | null;
  shadowStyle?: string | null;
  
  // Advanced
  animationSpeed?: string | null;
  customCss?: string | null;
  settings?: unknown;
  
  // Metadata
  description?: string | null;
  category?: string | null;
  previewImage?: string | null;
  version?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);
  private loadingSig = signal(false);
  private themeSig = signal<ActiveTheme | null>(null);
  readonly loading = this.loadingSig.asReadonly();
  readonly theme = this.themeSig.asReadonly();
  private appliedCssId = 'active-theme-inline';
  private appliedFontsId = 'theme-google-fonts';
  private darkModeSig = signal<boolean>(false);
  readonly darkMode = this.darkModeSig.asReadonly();
  private userPreferenceSet = false;
  private mediaQueryList: MediaQueryList | null = null;

  load() {
    if (this.loading()) return;
    
    // Skip loading theme in admin area unless explicit preview
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const preview = this.readPreviewId();
      if (!preview && path.startsWith('/admin')) return;
    }
    
    // Load from cache first
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('activeTheme');
      if (cached) {
        try { 
          const raw = JSON.parse(cached);
          const fromCache: ActiveTheme | null = raw && raw.id ? raw : (raw && raw.data && raw.data.id ? raw.data : null);
          if (fromCache) { 
            this.themeSig.set(fromCache); 
            this.applyToDocument(fromCache); 
          }
        } catch { /* ignore cache parse errors */ }
      }
      
      // Load dark mode preference
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
    
    // Load theme from server
    this.loadingSig.set(true);
    const previewId = this.readPreviewId();
    const url = previewId ? `/api/admin/themes/${previewId}` : '/api/theme/active';
  
    this.http.get<unknown>(url).subscribe({
      next: (raw) => {
        let theme: ActiveTheme | null = null;
        const isActiveTheme = (v: unknown): v is ActiveTheme => !!v && typeof v === 'object' && 'id' in v && 'name' in v;
        const isEnvelope = (v: unknown): v is { data: unknown } => !!v && typeof v === 'object' && 'data' in v;
        
        if (isActiveTheme(raw)) theme = raw;
        else if (isEnvelope(raw) && isActiveTheme(raw.data)) theme = raw.data;
        
        this.themeSig.set(theme);
        if (theme && typeof localStorage !== 'undefined' && !previewId) {
          try { 
            localStorage.setItem('activeTheme', JSON.stringify(theme)); 
          } catch { /* ignore cache save errors */ }
        }
        
        this.applyToDocument(theme || undefined);
        this.loadingSig.set(false);
      },
      error: () => { 
        this.loadingSig.set(false); 
      }
    });
  }

  toggleDarkMode() {
    this.darkModeSig.set(!this.darkModeSig());
    this.userPreferenceSet = true;
    if (typeof localStorage !== 'undefined') {
      try { 
        localStorage.setItem('darkMode', String(this.darkModeSig())); 
      } catch { /* ignore persist error */ }
    }
    this.applyDarkMode();
  }

  // Preview theme without persisting
  previewTheme(theme: ActiveTheme) {
    this.applyToDocument(theme);
  }

  // Reset to active theme (cancel preview)
  resetPreview() {
    const activeTheme = this.themeSig();
    if (activeTheme) {
      this.applyToDocument(activeTheme);
    }
  }

  private initSystemListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkModeSig.set(this.mediaQueryList.matches);
    const handler = (e: MediaQueryListEvent) => {
      if (this.userPreferenceSet) return;
      this.darkModeSig.set(e.matches);
      this.applyDarkMode();
    };
    try { 
      this.mediaQueryList.addEventListener('change', handler); 
    } catch { 
      /* Safari legacy fallback */
      this.mediaQueryList.addListener(handler); 
    }
  }

  private applyDarkMode() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    
    // Add transition for smooth dark mode toggle
    if (body && !body.classList.contains('theme-transition')) {
      body.classList.add('theme-transition');
      setTimeout(() => body.classList.remove('theme-transition'), 400);
    }
    
    if (this.darkModeSig()) {
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
    
    // Set theme ID attribute
    if (theme?.id) {
      root.setAttribute('data-theme-id', theme.id);
    } else {
      root.removeAttribute('data-theme-id');
    }
    
    // Add transition class for smooth theme changes
    if (!document.body.classList.contains('theme-transition')) {
      document.body.classList.add('theme-transition');
      setTimeout(() => document.body.classList.remove('theme-transition'), 400);
    }
    
    if (!theme) return;
    
    // Apply color variables
    this.setCSSProperty(root, '--theme-primary', theme.primaryColor);
    this.setCSSProperty(root, '--theme-secondary', theme.secondaryColor);
    this.setCSSProperty(root, '--theme-accent', theme.accentColor);
    this.setCSSProperty(root, '--theme-surface', theme.surfaceColor);
    this.setCSSProperty(root, '--theme-surface-alt', theme.surfaceAltColor);
    this.setCSSProperty(root, '--theme-text', theme.textColor);
    this.setCSSProperty(root, '--theme-text-secondary', theme.textSecondary);
    this.setCSSProperty(root, '--theme-border', theme.borderColor);
    this.setCSSProperty(root, '--theme-error', theme.errorColor);
    this.setCSSProperty(root, '--theme-success', theme.successColor);
    this.setCSSProperty(root, '--theme-warning', theme.warningColor);
    
    // Apply typography variables
    this.setCSSProperty(root, '--theme-font-heading', theme.fontHeading ? `'${theme.fontHeading}', sans-serif` : null);
    this.setCSSProperty(root, '--theme-font-body', theme.fontBody ? `'${theme.fontBody}', sans-serif` : null);
    this.setCSSProperty(root, '--theme-font-size-base', theme.fontSizeBase);
    this.setCSSProperty(root, '--theme-font-scale-ratio', theme.fontScaleRatio?.toString());
    this.setCSSProperty(root, '--theme-line-height-base', theme.lineHeightBase?.toString());
    this.setCSSProperty(root, '--theme-letter-spacing', theme.letterSpacing);
    
    // Apply layout variables
    this.setCSSProperty(root, '--theme-container-width', theme.containerWidth);
    this.setCSSProperty(root, '--theme-spacing-unit', theme.spacingUnit);
    this.setCSSProperty(root, '--theme-border-radius', theme.borderRadius);
    this.setCSSProperty(root, '--theme-border-width', theme.borderWidth);
    this.setCSSProperty(root, '--theme-animation-speed', theme.animationSpeed);
    
    // Apply style attributes for component styling
    if (theme.headerStyle) root.setAttribute('data-header-style', theme.headerStyle.toLowerCase());
    if (theme.footerStyle) root.setAttribute('data-footer-style', theme.footerStyle.toLowerCase());
    if (theme.buttonStyle) root.setAttribute('data-button-style', theme.buttonStyle.toLowerCase());
    if (theme.cardStyle) root.setAttribute('data-card-style', theme.cardStyle.toLowerCase());
    if (theme.shadowStyle) root.setAttribute('data-shadow-style', theme.shadowStyle.toLowerCase());
    
    // Apply shadow variables based on shadow style
    this.applyShadowStyle(root, theme.shadowStyle);
    
    // Handle legacy settings from the old system
    if (theme.settings && typeof theme.settings === 'object') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = theme.settings as any;
        const legacyMap: Record<string, string> = {
          bg: '--theme-surface',
          text: '--theme-text',
          surface: '--theme-surface',
          surfaceAlt: '--theme-surface-alt',
          border: '--theme-border'
        };
        
        Object.keys(legacyMap).forEach(key => {
          const value = s[key];
          if (typeof value === 'string' && value.trim()) {
            this.setCSSProperty(root, legacyMap[key], value.trim());
          }
        });
      } catch { /* ignore parsing errors */ }
    }
    
    // Apply custom CSS
    this.applyCustomCSS(theme.customCss);
    
    // Load Google Fonts if needed
    this.loadGoogleFonts(theme);
  }
  
  private setCSSProperty(element: HTMLElement, property: string, value: string | null | undefined) {
    if (value && value.trim()) {
      element.style.setProperty(property, value.trim());
    }
  }
  
  private applyShadowStyle(root: HTMLElement, shadowStyle?: string | null) {
    const shadowMap: Record<string, string> = {
      'NONE': 'none',
      'SOFT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      'MEDIUM': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      'STRONG': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      'COLORED': '0 4px 14px 0 rgba(37, 99, 235, 0.15)'
    };
    
    const shadowValue = shadowStyle && shadowMap[shadowStyle.toUpperCase()] 
      ? shadowMap[shadowStyle.toUpperCase()]
      : shadowMap['SOFT'];
      
    root.style.setProperty('--theme-shadow-base', shadowValue);
    root.style.setProperty('--theme-shadow-md', shadowValue);
  }
  
  private applyCustomCSS(customCss?: string | null) {
    const existing = document.getElementById(this.appliedCssId);
    if (existing) existing.remove();
    
    if (customCss && customCss.trim()) {
      const styleEl = document.createElement('style');
      styleEl.id = this.appliedCssId;
      
      // Transform CSS to work with dark mode
      let transformedCss = customCss.replace(/:root\b/g, ':root:not(.dark)');
      
      // Add scope comment
      if (!transformedCss.includes('--theme-')) {
        transformedCss = `/* Custom Theme CSS */\n${transformedCss}`;
      }
      
      styleEl.textContent = transformedCss;
      document.head.appendChild(styleEl);
    }
  }
  
  private loadGoogleFonts(theme: ActiveTheme) {
    const fontsToLoad = new Set<string>();
    
    // Collect unique fonts
    if (theme.fontHeading && !this.isSystemFont(theme.fontHeading)) {
      fontsToLoad.add(theme.fontHeading);
    }
    if (theme.fontBody && !this.isSystemFont(theme.fontBody) && theme.fontBody !== theme.fontHeading) {
      fontsToLoad.add(theme.fontBody);
    }
    
    if (fontsToLoad.size === 0) {
      // Remove existing Google Fonts if no custom fonts needed
      const existingLink = document.getElementById(this.appliedFontsId);
      if (existingLink) existingLink.remove();
      return;
    }
    
    // Create Google Fonts URL
    const fontParam = Array.from(fontsToLoad)
      .map(font => `${font.replace(/ /g, '+')}:400,500,600,700`)
      .join('&family=');
    
    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
    
    // Check if already loaded
    const existingLink = document.getElementById(this.appliedFontsId) as HTMLLinkElement;
    if (existingLink && existingLink.href === googleFontsUrl) return;
    
    // Remove old font link
    if (existingLink) existingLink.remove();
    
    // Add new font link
    const link = document.createElement('link');
    link.id = this.appliedFontsId;
    link.rel = 'stylesheet';
    link.href = googleFontsUrl;
    link.setAttribute('data-theme-fonts', 'true');
    document.head.appendChild(link);
  }
  
  private isSystemFont(font: string): boolean {
    const systemFonts = [
      'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace',
      'Arial', 'Helvetica', 'Times', 'Georgia', 'Verdana',
      'Courier', 'monospace', 'sans-serif', 'serif'
    ];
    return systemFonts.some(sf => font.toLowerCase().includes(sf.toLowerCase()));
  }
}