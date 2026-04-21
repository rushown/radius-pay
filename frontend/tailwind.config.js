/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark chocolate palette
        choco: {
          950: '#1A0F0A',
          900: '#2C1810',
          850: '#3E2723',
          800: '#4E342E',
          750: '#5D4037',
          700: '#6D4C41',
          600: '#795548',
          500: '#8D6E63',
          400: '#A1887F',
          300: '#BCAAA4',
          200: '#D7CCC8',
          100: '#EFEBE9',
          50:  '#FAF5F3',
        },
        gold: {
          DEFAULT: '#FFB300',
          light:   '#FFD54F',
          dark:    '#FF8F00',
          muted:   '#C8961F',
        },
        cream: '#F5ECD9',
        mocha: '#8B6914',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
      },
      animation: {
        'shimmer':     'shimmer 2s linear infinite',
        'pulse-gold':  'pulseGold 2s ease-in-out infinite',
        'slide-up':    'slideUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,179,0,0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(255,179,0,0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
