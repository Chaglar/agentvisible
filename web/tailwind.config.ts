import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark section colors
        'dark': {
          DEFAULT: '#0a0e17',
          secondary: '#0d1220',
          border: '#1e2436',
        },
        'dark-text': {
          primary: '#ffffff',
          secondary: '#94a3b8',
        },
        // Light section colors
        'light': {
          DEFAULT: '#ffffff',
          secondary: '#f8fafc',
          border: '#e2e8f0',
        },
        'light-text': {
          primary: '#0a0e17',
          secondary: '#64748b',
        },
        // Accent colors for dark sections
        accent: '#63ffd1',
        secondary: '#22d3ee',
        // Accent colors for light sections (darker for contrast)
        'accent-dark': '#0f6e56',
        'secondary-dark': '#0891b2',
        // Legacy colors for compatibility
        background: '#0a0e17',
        'gray-dark': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      letterSpacing: {
        'tight-premium': '-0.02em',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gauge-sweep': 'gauge-sweep 2s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'scale-click': 'scale-click 0.15s ease-out',
        'progress-fill': 'progress-fill 1.2s ease-out forwards',
      },
      keyframes: {
        'gauge-sweep': {
          '0%': { 'stroke-dashoffset': '628' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-click': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
      },
    },
  },
  plugins: [],
}

export default config