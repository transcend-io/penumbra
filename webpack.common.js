/**
 * All test logic lives in the Karma files - (any difference in test bundles happens there)
 * The only env differences is prod vs dev - the tests work in both environments.
 */

// external
const { join } = require('path');

module.exports = {
  node: {
    fs: 'empty',
  },
  entry: {
    main: join(__dirname, 'src', 'index.ts'),
    worker: join(__dirname, 'src', 'worker.penumbra.js'),
  },
  output: {
    filename: '[name].penumbra.js',
    path: join(__dirname, 'build'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
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
  target: 'web', // Make web variables accessible to webpack, e.g. window
  devtool: '',
};
