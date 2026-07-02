/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        kanit: ['Kanit', 'sans-serif'],
        thai: ['"Noto Sans Thai"', 'sans-serif'],
      },
      colors: {
        // Brand blues
        sky: {
          DEFAULT: '#0EA5E9',
          soft: '#7DD3FC',
          softer: '#BAE6FD',
        },
        brand: {
          600: '#0284C7',
          700: '#0369A1',
        },
        app: {
          bg: '#EFF6FF',
          bg2: '#F0F9FF',
        },
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: '0 10px 26px -20px rgba(2,132,199,.6)',
        sheet: '0 16px 34px -14px rgba(2,132,199,.7)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-22px)' },
        },
        pop: {
          '0%': { transform: 'scale(.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        sheetup: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadein: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        grow: {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
      },
      animation: {
        floaty: 'floaty 9s ease-in-out infinite',
        pop: 'pop .2s ease',
        sheetup: 'sheetup .3s cubic-bezier(.2,.8,.2,1)',
        fadein: 'fadein .2s ease',
        grow: 'grow .5s ease',
      },
    },
  },
  plugins: [],
}
