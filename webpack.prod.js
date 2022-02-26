// external
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');

// local
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          warnings: false,
          compress: {
            comparisons: false,
          },
          parse: {},
          mangle: true,
          output: {
            comments: false,
            ascii_only: true,
          },
        },
        // webpack 5
        // parallel: 2,
        parallel: true,
        cache: true,
        sourceMap: false,
      }),
    ],
  },
});
