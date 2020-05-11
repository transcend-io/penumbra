/**
 * All test logic lives in the Karma files - (any difference in test bundles happens there)
 * The only env differences is prod vs dev - the tests work in both environments.
 */
const { join } = require('path');
// const WorkerPlugin = require('worker-plugin');

const TerserPlugin = require('terser-webpack-plugin');

const src = join(__dirname, 'src');

const shouldMinify = ['staging', 'production'].includes(process.env.DEPLOY_ENV);

const config = {
  node: {
    fs: 'empty',
  },
  mode: shouldMinify ? 'production' : 'development',
  entry: {
    penumbra: `${src}/index.ts`,
    'penumbra.worker': `${src}/penumbra.worker.js`,
    tests: `${src}/tests/index.test.ts`,
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
        test: /\.(m?j|t)s$/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  target: 'web', // Make web variables accessible to webpack, e.g. window
  devtool: shouldMinify ? false : 'eval-source-map',
  optimization: {
    minimize: shouldMinify,
    minimizer: shouldMinify ? [new TerserPlugin()] : [],
  },
};

module.exports = config;
