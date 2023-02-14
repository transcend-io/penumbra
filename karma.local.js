// Karma configuration
const getGlobalConfig = require('./karma.global');

// Webpack dev config.
const webpackConfig = require('./webpack.dev');

module.exports = (config) => {
  const globalConfig = getGlobalConfig(config);

  config.set({
    ...globalConfig,

    // Set to dev webpack config.
    webpack: webpackConfig,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox', 'Safari'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    plugins: [
      ...globalConfig.plugins,
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-safari-launcher',
    ],
  });
};
