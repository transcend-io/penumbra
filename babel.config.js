module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        debug: false, // log babel preset-env config
        useBuiltIns: 'entry', // enable polyfills
        corejs: {
          version: 3,
          proposals: true,
        }, // Enable core-js and proposals
      },
    ],
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
  ],
};
