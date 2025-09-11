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
    const [{ setup, tw }, { default: presetTailwind }] = await Promise.all([
      import('@twind/core'),
      import('@twind/preset-tailwind'),
    ]);
    setup({
      // No preflight to avoid global reset conflicts with app CSS
      preflight: false,
      // Keep class names readable; hash off by default
      hash: false,
      // Use class-based dark mode like Tailwind
      // This makes `dark:` variants respond to a `.dark` class on an ancestor
      darkMode: 'class',
      presets: [presetTailwind()],
    });
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
    // @ts-ignore
    return origWarn.apply(console, args as any);
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
      // que son necesarios para que las reglas variantes apliquen al togglear el modo oscuro.
      tailwindish.forEach(t => { try { tw(t); } catch {} });
    });
  } finally {
    console.warn = origWarn;
  }
}
