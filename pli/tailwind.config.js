/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      'blue': "#6d83f2",
      'deep-blue': "#546bd6",
      'red': "#f26161",
    },
    extend: {},
  },
  plugins: []
}

