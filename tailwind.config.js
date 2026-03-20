/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:'#EBF0FF', 100:'#D6E0FF', 200:'#ADC2FF', 300:'#84A3FF',
          400:'#5B85FF', 500:'#3266FF', 600:'#2952CC', 700:'#1F3D99',
          800:'#142966', 900:'#0A1433', 950:'#050A1A',
        },
        gold: {
          50:'#FFFBEB', 100:'#FEF3C7', 200:'#FDE68A', 300:'#FCD34D',
          400:'#FBBF24', 500:'#F59E0B', 600:'#D97706', 700:'#B45309',
          800:'#92400E', 900:'#78350F',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}