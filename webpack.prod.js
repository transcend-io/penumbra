// external
const { merge } = require('webpack-merge');

// local
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'production',
});
