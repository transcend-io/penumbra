// Karma configuration
// const { short } = require('git-rev-sync');
const getGlobalConfig = require('./karma.global');
const packageJson = require('./package.json');

module.exports = (config) => {
  /**
   * @see https://www.browserstack.com/automate/capabilities
   */
  const customLaunchers = {
    bs_chrome_mac: {
      base: 'BrowserStack',
      browser: 'Chrome',
      browser_version: '104.0',
      os: 'OS X',
      os_version: 'Big Sur',
    },
    bs_safari_mac: {
      base: 'BrowserStack',
      browser: 'Safari',
      browser_version: '15.6',
      os: 'OS X',
      os_version: 'Monterey',
    },
    bs_firefox_pc: {
      base: 'BrowserStack',
      browser: 'Firefox',
      browser_version: '102.0',
      os: 'Windows',
      os_version: '10',
    },
    bs_edge_pc: {
      base: 'BrowserStack',
      browser: 'Edge',
      browser_version: '108.0',
      os: 'Windows',
      os_version: '11',
    },
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
      build: `Karma - penumbra@${packageJson.version}${
        process.env.GITHUB_RUN_ID
          ? ` - GitHub Run ID: ${process.env.GITHUB_RUN_ID}`
          : ''
      }`,
    },

    // define browsers
    customLaunchers,
    browsers: Object.keys(customLaunchers),

    reporters: [...globalConfig.reporters, 'BrowserStack'],

    plugins: [...globalConfig.plugins, 'karma-browserstack-launcher'],
  });
};
