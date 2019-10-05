// Karma configuration
// Generated on Sat Oct 05 2019 00:57:46 GMT-0700 (Pacific Daylight Time)

module.exports = (config) => {
  config.set({
    // global config of your BrowserStack account
    browserStack: {
      username: 'benjaminbrook2',
      accessKey: 'fxQjSDoWBNf4Kf6UQnVy',
    },

    // define browsers
    customLaunchers: {
      bs_firefox_mac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '21.0',
        os: 'OS X',
        os_version: 'Mountain Lion',
      },
      bs_iphone5: {
        base: 'BrowserStack',
        device: 'iPhone 5',
        os: 'ios',
        os_version: '6.0',
      },
    },

    browsers: ['bs_firefox_mac', 'bs_iphone5'],

    reporters: ['dots', 'BrowserStack'],
  });
};
