/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '.dark'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Axiforma', 'sans-serif'],
      },
    },
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
}
