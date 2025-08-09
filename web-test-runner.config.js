import { esbuildPlugin } from '@web/dev-server-esbuild';

/**
 * The timeout for all tests in milliseconds.
 * If changing this, make sure to update the timeout in the GitHub Actions workflow.
 */
const TIMEOUT_MS = 25 * 1000;

/**
 * Pass environment variables to the test environment.
 * @type {Record<string, string>}
 */
const environment = {
  PENUMBRA_LOG_START: process.env['PENUMBRA_LOG_START'] ?? 'false',
};

/** @type {import('@web/test-runner').TestRunnerConfig} */
const config = {
  plugins: [esbuildPlugin({ ts: true })],
  testRunnerHtml: (testFramework) => `
    <html>
      <head>
        <script>
          window.environment = ${JSON.stringify(environment)};
        </script>
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  testFramework: {
    config: {
      timeout: TIMEOUT_MS,
    },
  },
  testsFinishTimeout: TIMEOUT_MS,
  concurrentBrowsers: 3,
  coverage: true,
  coverageConfig: {
    include: ['src/**/*.ts'],
    report: true,
    reportDir: 'coverage',
  },
};

export default config;
