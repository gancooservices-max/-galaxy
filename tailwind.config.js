/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        display: ['Cinzel', 'serif'],
      },
      colors: {
        cosmic: {
          900: '#03030a',
          800: '#0f0f1f',
          accent: '#9d4edd',
        },
        nebula: {
          purple: '#8A2BE2',
          pink: '#FF69B4',
        },
        aurora: {
          cyan: '#00FFFF',
        },
        galaxy: {
          blue: '#1E90FF',
        },
        premium: {
          gold: '#FFD700',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
