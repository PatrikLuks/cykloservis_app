/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#394ff7',
          dark: '#2435c9'
        }
      }
    }
  },
  plugins: []
};
