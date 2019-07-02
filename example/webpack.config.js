const webpack = require('webpack');
const path = require('path');
const WorkerPlugin = require('worker-plugin');

const config = {
  entry: './example.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  watch: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new WorkerPlugin({
      globalObject: false,
    }),
  ],
  devtool: 'eval-source-map',
};

module.exports = config;
