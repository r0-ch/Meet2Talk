const colors = require('tailwindcss/colors')


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        'deep-blue': "#546bd6",
      },
      width: {
        '112': '28rem', // 448px
        '120': '30rem', // 480px
        '136': '34rem', // 544px
        '152': '38rem', // 608px
        '168': '42rem', // 672px
        '176': '44rem', // 704px
        '192': '48rem', // 768px
        '224': '56rem', // 896px
        '256': '64rem', // 1024px
        '288': '72rem', // 1152px
        '320': '80rem', // 1280px
      },
      height: {
        '112': '28rem', // 448px
        '120': '30rem', // 480px
        '136': '34rem', // 544px
        '152': '38rem', // 608px
        '168': '42rem', // 672px
        '176': '44rem', // 704px
        '192': '48rem', // 768px
        '224': '56rem', // 896px
        '256': '64rem', // 1024px
        '288': '72rem', // 1152px
        '320': '80rem', // 1280px
      },
    },
  },
  plugins: []
}
