module.exports = (config) => ({
  // base path that will be used to resolve all patterns (eg. files, exclude)
  basePath: '',

  // frameworks to use
  // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
  frameworks: ['tap'],

  customContextFile: 'penumbra-karma-context.html',

  // list of files / patterns to load in the browser
  files: [
    {
      pattern: 'src/penumbra.worker.js',
      included: false,
      served: true,
      nocache: false,
    },
    {
      pattern: 'src/index.ts',
      included: false,
      served: true,
      nocache: false,
    },
    {
      pattern: 'src/tests/index.test.ts',
      included: true,
      served: true,
      nocache: false,
    },
  ],

  // list of files / patterns to exclude
  exclude: [],

  // preprocess matching files before serving them to the browser
  // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
  preprocessors: {
    'src/**': ['webpack', 'sourcemap'],
  },

  // webpack configuration
  webpack: {
    // eslint-disable-next-line global-require
    ...require('./webpack.config.js'),
    devtool: 'cheap-inline-source-map',
  },

  plugins: [
    'karma-tap',
    'karma-coverage',
    'karma-webpack',
    'karma-sourcemap-loader',
  ],

  reporters: ['progress', 'coverage'],

  coverageReporter: {
    reporters: [{ type: 'lcov' }],
  },

  // web server port
  port: 9876,

  // enable / disable colors in the output (reporters and logs)
  colors: true,

  // level of logging
  // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
  logLevel: config.LOG_INFO,

  // enable / disable watching file agnd executing tests whenever any file changes
  autoWatch: false,

  // Continuous Integration mode
  // if true, Karma captures browsers, runs the tests and exits
  singleRun: true,

  // Concurrency level
  // how many browser should be started simultaneous
  concurrency: Infinity,
});
