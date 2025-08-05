// @ts-check
import { esbuildPlugin } from '@web/dev-server-esbuild';

/** The timeout for all tests in milliseconds */
const TIMEOUT_MS = 5 * 1000;

/**
 * Pass environment variables to the test environment.
 * @type {Record<string, string>}
 */
const environment = {
  /** @type {'true' | 'false'} */
  PENUMBRA_LOG_START: 'true',
};

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
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
