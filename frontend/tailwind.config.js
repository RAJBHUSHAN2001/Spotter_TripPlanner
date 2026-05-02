/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eld-dark': '#0f172a',
        'eld-accent': '#3b82f6',
      }
    },
  },
  plugins: [],
}
