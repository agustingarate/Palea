import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      borderRadius: { card: '12px' },
    },
  },
  plugins: [],
} satisfies Config;
