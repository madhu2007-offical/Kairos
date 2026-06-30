/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f6',
          100: '#e6edea',
          200: '#cedcd6',
          300: '#a7c1b5',
          400: '#7fa393',
          500: '#5e8574', // Primary Sage Accent
          600: '#48685b',
          700: '#3c544a',
          800: '#32453e',
          900: '#2c3b35',
          950: '#18221e', // Dark mode background focus
        },
        linen: {
          50: '#FAF9F6', // Softest warm white
          100: '#F4F1EA', // Warm linen
          200: '#E8E2D3',
          300: '#D7CCB7',
          400: '#C1B095',
          500: '#AB9473',
          600: '#98805E',
          700: '#7E694D',
          800: '#675640',
          900: '#554737',
          950: '#2E251D',
        },
        darkslate: {
          900: '#0F1210', // Deep dark slate with green tint
          950: '#070908', // True dark backdrop
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'accordion-down': 'accordionDown 0.2s ease-out',
        'accordion-up': 'accordionUp 0.2s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        accordionDown: {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        accordionUp: {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
