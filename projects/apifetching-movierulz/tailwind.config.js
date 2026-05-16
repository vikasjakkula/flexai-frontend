/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          DEFAULT: '#7C3AED',
          dark: '#512E9F',
          50: '#f5f3ff',
          100: '#ede9fe',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

