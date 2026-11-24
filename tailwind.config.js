/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        'brand-text': 'var(--brand-text)',
        'brand-button': 'var(--brand-button)',
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
        },
        ring: 'var(--ring)',
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        // The editor's desk palette (docs/DESIGN.md §2.1)
        desk: 'var(--desk)',
        surface: 'var(--surface)',
        paper: 'var(--paper)',
        ink: 'var(--ink)',
        graphite: 'var(--graphite)',
        rule: 'var(--rule)',
        pencil: {
          DEFAULT: 'var(--pencil)',
          dark: 'var(--pencil-dark)',
          soft: 'var(--pencil-soft)',
        },
        'on-pencil': 'var(--on-pencil)',
        highlighter: 'var(--highlighter)',
        tick: {
          DEFAULT: 'var(--tick)',
          soft: 'var(--tick-soft)',
        },
        redpen: {
          DEFAULT: 'var(--redpen)',
          soft: 'var(--redpen-soft)',
        },
        'page-ink': 'var(--page-ink)',
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lifted: 'var(--shadow-lifted)',
        page: 'var(--shadow-page)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'Geist Mono', 'JetBrains Mono', 'monospace'],
        serif: ['Newsreader', 'Merriweather', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
