const colors = require('tailwindcss/colors')


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      transparent: colors.transparent,
      current: colors.current,
      fuchsia: colors.fuchsia,
      'blue': {
        '50': '#eef4ff',
        '100': '#e0ebff',
        '200': '#c7dafe',
        '300': '#a5c1fc',
        '400': '#819df8',
        '500': '#6d83f2',
        '600': '#4654e5',
        '700': '#3842ca',
        '800': '#303aa3',
        '900': '#2e3781',
        '950': '#1b1f4b',
      },
      'deep-blue': {
        '50': '#f2f4fc',
        '100': '#e1e6f8',
        '200': '#c9d3f4',
        '300': '#a4b7ec',
        '400': '#7993e1',
        '500': '#546bd6',
        '600': '#4554cb',
        '700': '#3c44b9',
        '800': '#363997',
        '900': '#303478',
        '950': '#21224a',
      },
      'red': {
        '50': '#fef2f2',
        '100': '#fde3e3',
        '200': '#fccccc',
        '300': '#f9a8a8',
        '400': '#f26161',
        '500': '#ea4949',
        '600': '#d62c2c',
        '700': '#b42121',
        '800': '#951f1f',
        '900': '#7c2020',
        '950': '#430c0c',
      },
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      emerald: colors.emerald,
      indigo: colors.indigo,
      yellow: colors.yellow,
    },
    extend: {},
  },
  plugins: []
}