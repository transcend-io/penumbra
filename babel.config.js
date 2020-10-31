module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        debug: false, // log babel preset-env config
        targets: {
          edge: '18',
          firefox: '80',
          chrome: '85',
          safari: '14',
        },
      },
    ],
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
};
