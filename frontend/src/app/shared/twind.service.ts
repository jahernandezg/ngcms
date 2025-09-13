import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TwindService {
  private initPromise: Promise<{ tw: (classNames: string) => string }> | null = null;

  private async ensureInit() {
    if (this.initPromise) return this.initPromise;
    if (typeof window === 'undefined') {
      // SSR: no-op placeholder
      this.initPromise = Promise.resolve({ tw: () => '' });
      return this.initPromise;
    }
    this.initPromise = (async () => {
      const [core, { default: presetTailwind }] = await Promise.all([
        import('@twind/core'),
        import('@twind/preset-tailwind'),
      ]);
      const { setup, tw, dom } = core as typeof import('@twind/core');
      setup({
        // Mantener sin preflight para no interferir con estilos globales de la app
        preflight: false,
        // Clases legibles; sin hash
        hash: false,
        // Modo oscuro por clase `.dark`
        darkMode: 'class',
        presets: [presetTailwind()],
        // Reglas personalizadas para utilidades no estándar usadas en contenido dinámico
        rules: [
          // Patrón de grilla decorativo
          ['bg-grid-pattern', {
            backgroundImage: 'linear-gradient(to right, var(--theme-border) 1px, transparent 1px), linear-gradient(to bottom, var(--theme-border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: 'center center'
          }],
          // Aspect ratios
          ['aspect-square', { aspectRatio: '1 / 1' }],
          [/^aspect-\[(.+)\]$/, (_m, ratio) => ({ aspectRatio: String(ratio) })],
          // Clases marcadoras de estructura (no generan estilos)
          ['mobile-dropdown-content', {}],
          ['mobile-dropdown-trigger', {}],
          ['site-shell', {}],
          ['theme-transition', {}],
          ['container-fluid', {}],
          ['text-text-secondary', {}],
        ],
      }, dom());
      return { tw };
    })();
    return this.initPromise;
  }

  // Aplica tw() a todos los atributos class dentro del contenedor, útil tras inyectar HTML
  async applyToContainer(container?: Element) {
    if (typeof document === 'undefined') return;
    const { tw } = await this.ensureInit();
    const root = container ?? document.body;

    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      // Suprimir advertencias por clases desconocidas de Twind
      const asText = args.map((a) => {
        if (typeof a === 'string') return a;
        if (a && typeof a === 'object') {
          try { return JSON.stringify(a); } catch { /* noop */ }
        }
        return '';
      }).join(' ');
      if (asText.includes('[TWIND_INVALID_CLASS]') || asText.includes('Unknown class')) return;
      return (origWarn as (...a: unknown[]) => void).apply(console, args as unknown[]);
    };
    try {
      const deny = new Set([
        'theme-transition', 'dark-mode', 'site-shell', 'container-fluid', 'prose', 'dark',
        'mobile-dropdown-content', 'mobile-dropdown-trigger'
      ]);
      const nodes = root.querySelectorAll('[class]');
      nodes.forEach((el) => {
        const elem = el as HTMLElement;
        const cls = (elem.getAttribute('class') || '').trim();
        if (!cls) return;
        const tokens = cls.split(/\s+/);
        const tailwindish = tokens.filter(t => !deny.has(t));
        if (!tailwindish.length) return;
        // Generamos CSS sin reescribir className para conservar variantes como "dark:*"
        try { tw(tailwindish.join(' ')); } catch { /* ignore invalid token */ }
      });
    } finally {
      console.warn = origWarn;
    }
  }
}
