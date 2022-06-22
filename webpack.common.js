/**
 * All test logic lives in the Karma files - (any difference in test bundles happens there)
 * The only env differences is prod vs dev - the tests work in both environments.
 */

// external
const { join } = require('path');
// const { ProvidePlugin } = require('webpack');

module.exports = {
  entry: {
    main: join(__dirname, 'src', 'index.ts'),
    worker: join(__dirname, 'src', 'worker.penumbra.js'),
  },
  output: {
    filename: '[name].penumbra.js',
    path: join(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // TODO: https://github.com/transcend-io/penumbra/issues/155 - webpack 5
    // fallback: {
    //   path: require.resolve('path-browserify'),
    //   stream: require.resolve('stream-browserify'),
    // },
  },
  watch: false,
  module: {
    rules: [
      {
        test: /\.(j|t)s$/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  // TODO: https://github.com/transcend-io/penumbra/issues/155 - webpack 5
  // plugins: [
  // new ProvidePlugin({
  //   Buffer: ['buffer', 'Buffer'],
  //   process: 'process/browser',
  // }),
  // ],
  // devtool: 'source-map',
  devtool: '',
  target: 'web', // Make web variables accessible to webpack, e.g. window
};
