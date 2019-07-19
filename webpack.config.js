const path = require('path');
// const WorkerPlugin = require('worker-plugin');

const babelLoader = {
  loader: 'babel-loader',
};

const config = {
  entry: `${path.resolve(__dirname, 'src')}/index.ts`,
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  mode: 'development',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  watch: false,
  module: {
    rules: [
      // {
      //   test: /\.worker\.ts$/,
      //   use: {
      //     loader: 'worker-loader',
      //     // options: { inline: true },
      //   },
      // },
      {
        test: /^.*\.(ts|js)?$/,
        use: [
          babelLoader,
          {
            loader: 'ts-loader',
            options: {
              allowTsInNodeModules: false,
              configFile: 'tsconfig.json',
            },
          },
        ],
      },
      {
        test: /\.worker\.ts$/,
        use: [
          babelLoader,
          {
            loader: 'ts-loader',
            options: {
              allowTsInNodeModules: false,
              configFile: 'tsconfig.json',
            },
          },
          { loader: 'worker-loader' },
        ],
      },
      {
        test: /\.(js|jsx)?$/, // Transform all .js/.jsx files required somewhere with Babel
        use: babelLoader,
        exclude: /node_modules/,
      },
    ],
  },
  // plugins: [
  //   new WorkerPlugin({
  //     globalObject: false,
  //   }),
  // ],
  devtool: 'eval-source-map',
  // target: 'web',
};

module.exports = config;
