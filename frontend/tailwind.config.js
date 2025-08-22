const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Usa sólo clase .dark para variantes dark:
  darkMode: 'class',
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        'bg-app': 'var(--color-bg)',
  'text-app': 'var(--color-text)',
  surface: 'var(--color-surface)',
  'surface-alt': 'var(--color-surface-alt)',
  'border-app': 'var(--color-border)'
      }
    },
  },
  plugins: [],
};
