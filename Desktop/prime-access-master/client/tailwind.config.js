/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep teal - the design system of the reference (Prime Gate Global)
        brand: {
          50: '#f0f7f7',
          100: '#dcefef',
          200: '#b7dfdf',
          300: '#8ac8c9',
          400: '#57a9ab',
          500: '#3a8c8f',
          600: '#2b7175',
          700: '#255c60',
          800: '#1c4a4e',
          900: '#0f373b',
          950: '#002b2d',
        },
        // Light mint-teal accents (kept under the gold key so all usages re-theme)
        gold: {
          50: '#f1faf9',
          100: '#d8f3f0',
          200: '#b3e7e2',
          300: '#83d5cf',
          400: '#56beb7',
          500: '#39a89f',
          600: '#2a8780',
          700: '#256c67',
          800: '#1f5753',
          900: '#1c4845',
          950: '#0b2927',
        },
      },
      fontFamily: {
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(0, 43, 45, 0.18)',
        card: '0 4px 24px -8px rgba(0, 43, 45, 0.12)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};