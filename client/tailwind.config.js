/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#004D40', // Brand Teal
          50: '#e0f2f1',
          100: '#b2dfdb',
          200: '#80cbc4',
          300: '#4db6ac',
          400: '#26a69a',
          500: '#009688',
          600: '#00897b',
          700: '#00796b',
          800: '#00695c',
          900: '#004d40',
        },
        'background-light': '#f6f7f8',
        'background-dark': '#111921',
        'surface-light': '#ffffff',
        'surface-dark': '#1A222C',
        'border-light': '#dce0e5',
        'border-dark': '#2a3441',
        secondary: {
          DEFAULT: '#D4AF37', // Brand Gold
          50: '#fbf7e7',
          100: '#f5ebc3',
          200: '#efdf9b',
          300: '#e9d373',
          400: '#e3c74b',
          500: '#ddbb23',
          600: '#b1961c',
          700: '#857115',
          800: '#594b0e',
          900: '#2d2607',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#f8fafc',
        surface: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Manrope', 'Outfit', 'sans-serif'],
        'public': ['Plus Jakarta Sans', 'sans-serif'],
        'dashboard': ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
      }
    },
  },
  darkMode: 'class', // Ensure dark mode is enabled
  plugins: [],
}
