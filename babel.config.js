module.exports = {
  presets: [
    '@babel/preset-typescript',
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
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
  ],
};
