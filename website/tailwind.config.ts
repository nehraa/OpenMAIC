import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: 'var(--coral)',
          strong: 'var(--coral-strong)',
          soft: 'var(--coral-soft)',
          glow: 'var(--coral-glow)',
        },
        indigo: {
          ink: 'var(--indigo-ink)',
          deep: 'var(--indigo-deep)',
          electric: 'var(--indigo-electric)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          soft: 'var(--teal-soft)',
          glow: 'var(--teal-glow)',
        },
        violet: {
          DEFAULT: 'var(--violet)',
          soft: 'var(--violet-soft)',
          glow: 'var(--violet-glow)',
        },
        slate: {
          25: 'var(--slate-25)',
          50: 'var(--slate-50)',
          100: 'var(--slate-100)',
          200: 'var(--slate-200)',
          300: 'var(--slate-300)',
          400: 'var(--slate-400)',
          500: 'var(--slate-500)',
          700: 'var(--slate-700)',
          900: 'var(--slate-900)',
        },
        dark: {
          base: 'var(--dark-base)',
          hero: 'var(--dark-hero)',
          surface: 'var(--dark-surface)',
          card: 'var(--dark-card)',
          line: 'var(--dark-line)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', 'Fira Code', 'monospace'],
      },
      fontSize: {
        display: 'clamp(3.5rem, 8vw, 7.5rem)',
        kicker: 'clamp(0.78rem, 1vw, 0.9rem)',
        h1: 'clamp(2.25rem, 5vw, 4.5rem)',
        h2: 'clamp(1.5rem, 3vw, 2.5rem)',
        h3: '1.25rem',
        'body-lg': 'clamp(1.1rem, 1.7vw, 1.35rem)',
        body: '1rem',
        small: '0.875rem',
        xs: '0.75rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-coral': '0 0 40px var(--coral-glow)',
        'glow-teal': '0 0 40px var(--teal-glow)',
        'glow-violet': '0 0 40px var(--violet-glow)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-coral': 'var(--gradient-coral)',
        'gradient-teal': 'var(--gradient-teal)',
        'gradient-violet': 'var(--gradient-violet)',
        'gradient-glass': 'var(--gradient-glass)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px var(--coral-glow)' },
          '50%': { boxShadow: '0 0 40px var(--coral-glow)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
