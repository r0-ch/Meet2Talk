const colors = require('tailwindcss/colors');
const textShadow = require('tailwindcss-textshadow');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        'deep-blue': "#546bd6",
        gray: colors.gray,
        blue: colors.blue,
        indigo: colors.indigo,
      },
      width: {
        '112': '28rem',
        '120': '30rem',
        '136': '34rem',
        '152': '38rem',
        '168': '42rem',
        '176': '44rem',
        '192': '48rem',
        '224': '56rem',
        '256': '64rem',
        '288': '72rem',
        '320': '80rem',
      },
      height: {
        '112': '28rem',
        '120': '30rem',
        '136': '34rem',
        '152': '38rem',
        '168': '42rem',
        '176': '44rem',
        '192': '48rem',
        '224': '56rem',
        '256': '64rem',
        '288': '72rem',
        '320': '80rem',
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      fontFamily: {
        'playwright': ['Playwrite England', 'sans-serif'],
      },
      textShadow: {
        default: '1px 1px 0 rgba(0, 0, 0, 0.5)',
        md: '2px 2px 0 rgba(0, 0, 0, 0.5)',
        lg: '3px 3px 0 rgba(0, 0, 0, 0.5)',
        none: 'none',
      },
    },
  },
  plugins: [textShadow], // Ajout du plugin
};
