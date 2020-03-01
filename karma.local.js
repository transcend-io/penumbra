// Karma configuration
const getGlobalConfig = require('./karma.global');

module.exports = (config) => {
  const globalConfig = getGlobalConfig(config);

  config.set({
    ...globalConfig,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    preprocessors: {
      ...globalConfig.preprocessors,
      // 'src/!(test|demo)/**': ['coverage'],
      'build/penumbra.worker.js': ['coverage'],
      'build/penumbra.js': ['coverage'],
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      reporters: [{ type: 'lcov' }],
    },

    plugins: [...globalConfig.plugins, 'karma-chrome-launcher'],
  });
};
