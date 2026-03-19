/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette - Navy + Gold
        navy: {
          50:  '#f0f4fb',
          100: '#d9e4f5',
          200: '#b3c9ea',
          300: '#7da4d8',
          400: '#4a7ec3',
          500: '#2d5fa8',
          600: '#1e4789',
          700: '#163570',
          800: '#0f2454',
          900: '#0a1a3d',
          950: '#060e24',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Status colors
        status: {
          draft:      '#94a3b8',
          pending:    '#fb923c',
          review:     '#60a5fa',
          incomplete: '#f87171',
          complete:   '#34d399',
          active:     '#818cf8',
          archived:   '#6b7280',
          urgent:     '#ef4444',
          success:    '#22c55e',
        }
      },
      fontFamily: {
        sans:    ['var(--font-sora)', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease-out forwards',
        'slide-up':    'slideUp 0.4s ease-out forwards',
        'slide-right': 'slideRight 0.3s ease-out forwards',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'count-up':    'countUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        countUp:   { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(10,26,61,0.08), 0 4px 16px rgba(10,26,61,0.06)',
        'card-lg': '0 4px 8px rgba(10,26,61,0.1), 0 12px 40px rgba(10,26,61,0.12)',
        'gold':    '0 0 20px rgba(245,158,11,0.25)',
        'navy':    '0 0 20px rgba(15,36,84,0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
