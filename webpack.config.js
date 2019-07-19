const path = require('path');
// const WorkerPlugin = require('worker-plugin');

const config = {
  entry: {
    bundle: `${path.resolve(__dirname, 'src')}/index.ts`,
    'decrypt.penumbra.worker': `${path.resolve(
      __dirname,
      'src',
    )}/decrypt.penumbra.worker.js`,
    'zip.penumbra.worker': `${path.resolve(
      __dirname,
      'src',
    )}/zip.penumbra.worker.js`,
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  },
  mode: 'development',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  watch: false,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              allowTsInNodeModules: false,
              configFile: 'tsconfig.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
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
  devtool: 'eval-source-map',
  // target: 'web',
};

module.exports = config;
