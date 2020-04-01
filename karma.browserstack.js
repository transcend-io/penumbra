// Karma configuration
const { short } = require('git-rev-sync');
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
    // bs_safari_mac: {
    //   base: 'BrowserStack',
    //   browser: 'Safari',
    //   browser_version: '13',
    //   os: 'OS X',
    //   os_version: 'Catalina',
    // },
    bs_edge_pc: {
      base: 'BrowserStack',
      browser: 'Edge',
      browser_version: '80',
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
      build: process.env.TRAVIS_BUILD_NUMBER || short(), // process.env.CIRCLE_BUILD_NUM
    },

    // define browsers
    customLaunchers,
    browsers: Object.keys(customLaunchers),

    reporters: [...globalConfig.reporters, 'BrowserStack'],

    plugins: [...globalConfig.plugins, 'karma-browserstack-launcher'],
  });
};
