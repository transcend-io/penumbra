// Karma configuration
const getGlobalConfig = require('./karma.global');

module.exports = (config) => {
  // TODO add more browsers. this util is useful:
  // https://www.browserstack.com/automate/capabilities
  const customLaunchers = {
    bs_chrome_mac: {
      base: 'BrowserStack',
      browser: 'Chrome',
      browser_version: '78.0',
      os: 'OS X',
      os_version: 'Mojave',
    },
    bs_firefox_pc: {
      base: 'BrowserStack',
      browser: 'Firefox',
      browser_version: '71.0',
      os: 'Windows',
      os_version: '10',
    },
  };

  const globalConfig = getGlobalConfig(config);

  config.set({
    ...globalConfig,

    // global config of your BrowserStack account
    browserStack: {
      username: 'benjaminbrook3',
      project: 'Penumbra',
      video: false,
      build: process.env.TRAVIS_BUILD_NUMBER, // process.env.CIRCLE_BUILD_NUM
    },

    // define browsers
    customLaunchers,
    browsers: Object.keys(customLaunchers),

    preprocessors: {
      ...globalConfig.preprocessors,
      // 'src/!(test|demo)/**': ['coverage'],
      'build/penumbra.worker.js': ['coverage'],
      'build/penumbra.js': ['coverage'],
    },

    reporters: ['progress', 'coverage', 'BrowserStack'],

    coverageReporter: {
      reporters: [{ type: 'lcov' }],
    },
    plugins: [...globalConfig.plugins, 'karma-browserstack-launcher'],
  });
};
