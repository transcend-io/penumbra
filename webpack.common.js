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
    penumbra: join(__dirname, 'src', 'index.ts'),
    'penumbra.worker': join(__dirname, 'src', 'penumbra.worker.js'),
    tests: join(__dirname, 'src', 'tests', 'index.test.ts'),
  },
  output: {
    filename: '[name].js',
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
};
