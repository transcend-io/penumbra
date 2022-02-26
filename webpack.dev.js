// external
const { merge } = require('webpack-merge');

// local
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  optimization: {
    minimize: false,
    minimizer: [],
  },
});
