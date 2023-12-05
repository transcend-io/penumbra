// Karma configuration
const { short } = require('git-rev-sync');
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
      browser_version: '118.0',
      os: 'OS X',
      os_version: 'Sonoma',
      local: "false",
      networkLogs: "true",
      seleniumVersion: "3.14.0",
    },
    bs_safari_mac: {
      base: 'BrowserStack',
      browser: 'Safari',
      browser_version: '17.0',
      os: 'OS X',
      os_version: 'Sonoma',
      local: 'false',
      networkLogs: "true",
      seleniumVersion: "3.14.0",
    },
    // TODO: https://github.com/transcend-io/penumbra/issues/249
    // bs_firefox_pc: {
    //   base: 'BrowserStack',
    //   browser: 'Firefox',
    //   browser_version: '102.0',
    //   os: 'Windows',
    //   os_version: '10',
    // },
    bs_edge_pc: {
      base: 'BrowserStack',
      browser: 'Edge',
      browser_version: '118.0',
      os: 'Windows',
      os_version: '11',
      local: 'false',
      networkLogs: "true",
      seleniumVersion: "3.14.0",
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
      video: true,
      build: `penumbra@${packageJson.version} - ${short()} - ${process.env.GITHUB_RUN_ID ? `CI: ${process.env.GITHUB_RUN_ID}` : 'Local'
        }`,
      // TODO - https://github.com/transcend-io/penumbra/issues/249
      // // A secure context must be used for `crypto.subtle` to be defined
      // acceptInsecureCerts: 'true',
      // acceptSslCerts: 'true',
    },

    // define browsers
    customLaunchers,
    browsers: Object.keys(customLaunchers),

    reporters: [...globalConfig.reporters, 'BrowserStack'],

    plugins: [...globalConfig.plugins, 'karma-browserstack-launcher'],
  });
};
