module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        debug: false, // log babel preset-env config
        useBuiltIns: 'entry', // enable polyfills
        corejs: {
          version: 3,
          proposals: true,
        }, // Enable core-js and proposals
      },
    ],
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
  ],
};

const config = {
  basePath: '',
  frameworks: ['mocha', 'chai'],
  files: ['src/**/*.js'],
  exclude: [],
  preprocessors: {
    'src/**/*.js': ['webpack'],
  },
  webpack: {
    module: {
      rules: [
        {
          test: /\.js$/,
          include: 'src',
          use: {
            loader: 'babel-loader',
            options: {
              sourceMap: false,
              presets: ['env', 'stage-2', 'flow'],
              plugins: [
                'transform-runtime',
                [
                  'istanbul',
                  {
                    exclude: '**/*.spec.js',
                  },
                ],
              ],
            },
          },
        },
      ],
    },
    plugins: [],
    resolve: {
      extensions: ['.js'],
      alias: {
        '@src': 'src',
      },
    },
    devtool: '',
  },
  webpackMiddleware: {
    stats: 'errors-only',
  },
  mochaReporter: {
    showDiff: true,
  },
  coverageReporter: {
    dir: 'coverage',
    reporters: [
      {
        type: 'text-summary',
      },
    ],
    check: {
      global: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 90,
      },
    },
  },
  customLaunchers: {
    sauce_ie: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11',
    },
  },
  captureTimeout: 120000,
  browserNoActivityTimeout: 120000,
  sauceLabs: {
    testName: 'sauce example',
  },
  reporters: ['mocha', 'coverage', 'saucelabs'],
  port: 9876,
  colors: true,
  autoWatch: true,
  concurrency: Infinity,
  browsers: ['sauce_ie'],
};
