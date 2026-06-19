/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './sections/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        codiva: {
          primary: '#104E4E',      // Dark Teal - principal
          background: '#F9FAFB',   // Gris cálido tenue
          secondary: '#6A757A',    // Gris suave para texto complementario
          muted: '#E5E7EB',        // Gris claro para borders y fondo neutral suave
        },
      },
      fontFamily: {
        satoshi: ['var(--font-satoshi)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'], // redefine base
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide')],
};