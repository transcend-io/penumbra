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
    path: join(__dirname, 'build'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  watch: false,
  module: {
    rules: [
      {
        test: /^.*\.(ts|tsx)?$/,
        use: [
          {
            loader: 'babel-loader',
            // eslint-disable-next-line global-require
            options: require('./babel.config'),
          },
          {
            loader: 'ts-loader',
            options: {
              allowTsInNodeModules: false,
            },
          },
        ],
        // exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)?$/, // Transform all .js/.jsx files required somewhere with Babel
        include: [src],
        use: {
          loader: 'babel-loader',
        },
      },
      // {
      //   test: /\.worker\.js$/,
      //   use: [
      //     {
      //       loader: 'babel-loader',
      //     },
      //     {
      //       loader: 'ts-loader',
      //       options: {
      //         allowTsInNodeModules: false,
      //         configFile: 'tsconfig.json',
      //       },
      //     },
      //     // {
      //     //   loader: 'worker-loader',
      //     //   // options: { inline: true },
      //     // },
      //   ],
      //   // exclude: /node_modules/,
      // },
      // {
      //   test: /\.(js|jsx)?$/, // Transform all .js/.jsx files required somewhere with Babel
      //   use: babelLoader,
      //   exclude: /node_modules/,
      // },
    ],
  },
  // plugins: [
  //   new WorkerPlugin({
  //     globalObject: false,
  //   }),
  // ],
  target: 'web', // Make web variables accessible to webpack, e.g. window
  devtool: shouldMinify ? false : 'eval-source-map',
  optimization: {
    minimize: shouldMinify,
    minimizer: shouldMinify ? [new TerserPlugin()] : [],
  },
};

module.exports = config;
