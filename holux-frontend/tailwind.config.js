/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'holux-dark': '#1C2321',
        'holux-light': '#F2EFE9',
        'holux-teal': '#3C6E71',
        'holux-rust': '#B85C38',
      }
    },
  },
  plugins: [],
}
