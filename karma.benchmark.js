// Karma configuration
const getGlobalConfig = require('./karma.benchmark.global');

module.exports = (config) => {
  const globalConfig = getGlobalConfig(config);

  config.set({
    ...globalConfig,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // increase browserNoActivityTimeout to 60 seconds
    browserNoActivityTimeout: 600000,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    plugins: [...globalConfig.plugins, 'karma-chrome-launcher'],
  });
};
