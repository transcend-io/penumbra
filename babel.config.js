module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        debug: false, // log babel preset-env config
        useBuiltIns: 'entry', // enable polyfills
        modules: 'commonjs',
        corejs: 3,
      },
    ],
  ],
  plugins: ['@babel/plugin-transform-typescript'],
};
