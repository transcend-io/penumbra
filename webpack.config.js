const { join } = require('path');
// const WorkerPlugin = require('worker-plugin');

const src = join(__dirname, 'src');

const config = {
  mode: 'development',
  entry: {
    penumbra: `${src}/index.ts`,
    'penumbra.worker': `${src}/penumbra.worker.js`,
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
  devtool: 'eval-source-map',
  target: 'web', // Make web variables accessible to webpack, e.g. window
  // target: 'web',
};

module.exports = config;
