export default {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    ["babel-plugin-transform-import-meta", { module: "es2020" }]
  ]
};