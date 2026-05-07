/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#fdfaf4', 2: '#f8f3e8', 3: '#f0e9d6' },
        gold:  { DEFAULT: '#c9a84c', light: '#e8cc80', pale: '#f5ebc8', dark: '#9a7530', deep: '#6b5020' },
        ink:   { DEFAULT: '#1a1510', 2: '#3a3020', 3: '#6b5f48' },
        muted: { DEFAULT: '#a89880', light: '#d4c8b0' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        ui:      ['"Tenor Sans"', 'serif'],
        body:    ['Raleway', 'sans-serif'],
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
      },
    },
  },
  plugins: [],
}