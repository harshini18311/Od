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
        navy: {
          50: '#f4f6fa',
          100: '#eaedf4',
          200: '#cfd8e7',
          300: '#a3b7d1',
          400: '#7291b8',
          500: '#4e709e',
          600: '#3c5683',
          700: '#32476d',
          800: '#1e293b', // Navy Slate
          900: '#0f172a', // Deep Navy base
          950: '#0b0f19', // Darkest Slate
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Primary Amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
