// Karma configuration
const { short } = require('git-rev-sync');
const getGlobalConfig = require('./karma.global');

module.exports = (config) => {
  const customLaunchers = {
    bs_chrome_pc: {
      base: 'BrowserStack',
      browser: 'Chrome',
      browser_version: '85',
      os: 'Windows',
      os_version: '10',
      device: null,
      real_mobile: null,
    },
    bs_firefox_pc: {
      base: 'BrowserStack',
      browser: 'Firefox',
      browser_version: '80',
      os: 'Windows',
      os_version: '10',
      device: null,
      real_mobile: null,
    },
    /**
     * TODO: https://github.com/transcend-io/penumbra/issues/164
     * Uncomment this entry once BrowserStack supports Safari 14.
     * In the meantime Safari can be tested locally through `yarn start:demo`.
     */
    // bs_safari_mac: {
    //   base: 'BrowserStack',
    //   browser: 'Safari',
    //   browser_version: '14',
    //   os: 'OS X',
    //   os_version: 'Catalina',
    //   device: null,
    //   real_mobile: null,
    // },
  };

  const globalConfig = getGlobalConfig(config);

  config.set({
    ...globalConfig,

    captureTimeout: 400000,
    browserDisconnectTolerance: 3,
    browserDisconnectTimeout: 400000,
    browserNoActivityTimeout: 400000,

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
