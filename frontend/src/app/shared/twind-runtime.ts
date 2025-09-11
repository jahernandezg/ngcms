// Lightweight Twind runtime bootstrap for dynamic HTML containers
// Only runs in browser. Keeps a singleton Twind setup and exposes an observe helper

let twindInitPromise: Promise<{ observe: (target?: Node) => () => void }> | null = null;

async function initTwindOnce() {
  if (twindInitPromise) return twindInitPromise;
  if (typeof window === 'undefined') {
    // SSR: no-op placeholder
    twindInitPromise = Promise.resolve({ observe: () => () => {} });
    return twindInitPromise;
  }
  twindInitPromise = (async () => {
    const [{ setup }, { default: presetTailwind }, { observe }] = await Promise.all([
      import('twind'),
      import('@twind/preset-tailwind'),
      import('twind/observe'),
    ]);
    setup({
      // No preflight to avoid global reset conflicts with app CSS
      preflight: false,
      // Keep class names readable; hash off by default
      hash: false,
      presets: [presetTailwind()],
    });
    return { observe };
  })();
  return twindInitPromise;
}

export async function observeDynamicContainer(container?: Element): Promise<() => void> {
  const { observe } = await initTwindOnce();
  // Limit observation to the provided container if possible
  return observe(container ?? document.body);
}
