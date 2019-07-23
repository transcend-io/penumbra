module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        debug: false, // log babel preset-env config
        // useBuiltIns: 'entry', // enable polyfills
      },
    ],
  ],
  plugins: ['@babel/plugin-transform-typescript'],
};
