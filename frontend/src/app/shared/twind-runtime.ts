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
  // Twind v1: tw(className) returns a class string and ensures styles exist
  // We iterate class-bearing nodes and call tw on their className
  const nodes = root.querySelectorAll('[class]');
  nodes.forEach((el) => {
    const elem = el as HTMLElement;
    const cls = elem.getAttribute('class') || '';
    if (!cls.trim()) return;
    const applied = tw(cls);
    // Replace class to the normalized/generated form to ensure consistency
    if (applied && applied !== cls) elem.setAttribute('class', applied);
  });
}
