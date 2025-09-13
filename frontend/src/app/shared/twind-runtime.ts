// Lightweight Twind runtime bootstrap for dynamic HTML containers
// Only runs in browser. Keeps a singleton Twind setup and exposes an observe helper

let twindInitPromise: Promise<{ tw: (classNames: string) => string }> | null = null;

async function initTwindOnce() {
  if (twindInitPromise) return twindInitPromise;
  if (typeof window === 'undefined') {
    // SSR: no-op placeholder
    twindInitPromise = Promise.resolve({ tw: () => '' });
    return twindInitPromise;
  }
  twindInitPromise = (async () => {
    const [core, { default: presetTailwind }] = await Promise.all([
      import('@twind/core'),
      import('@twind/preset-tailwind'),
    ]);
    const { setup, tw, dom } = core as typeof import('@twind/core');
    setup({
      // No preflight to avoid global reset conflicts with app CSS
      preflight: false,
      // Keep class names readable; hash off by default
      hash: false,
      // Use class-based dark mode; `.dark` ancestor controls `dark:` variants
      darkMode: 'class',
      presets: [presetTailwind()],
    }, dom());
    return { tw };
  })();
  return twindInitPromise;
}

// Apply tw() to all class attributes inside container, useful right after injecting HTML
export async function applyTwindToContainer(container?: Element) {
  if (typeof document === 'undefined') return;
  const { tw } = await initTwindOnce();
  const root = container ?? document.body;

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('[TWIND_INVALID_CLASS]')) return;
    return (origWarn as (...a: unknown[]) => void).apply(console, args as unknown[]);
  };
  try {
    const deny = new Set([
      'theme-transition', 'dark-mode', 'site-shell', 'container-fluid', 'bg-grid-pattern', 'prose', 'dark'
    ]);
    const nodes = root.querySelectorAll('[class]');
    nodes.forEach((el) => {
      const elem = el as HTMLElement;
      const cls = (elem.getAttribute('class') || '').trim();
      if (!cls) return;
      const tokens = cls.split(/\s+/);
      const tailwindish = tokens.filter(t => !deny.has(t));
      if (!tailwindish.length) return;
      // IMPORTANTE: Solo generamos CSS, no reescribimos className para conservar tokens como "dark:*"
      // También pasamos la cadena completa a tw() para soportar combinaciones y variantes (hover:, md:, etc.)
      try { tw(tailwindish.join(' ')); } catch { /* ignore invalid token */ }
    });
  } finally {
    console.warn = origWarn;
  }
}
