import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/index.ts',
    'src/API.ts',
    'src/worker.penumbra.ts',
    'tests/*.test.ts',
    'web-test-runner.config.js',
  ],
  ignore: ['fixtures/**'],
  ignoreDependencies: [
    '@types/mocha',
    '@web/dev-server-esbuild',
    '@web/test-runner-playwright',
  ],
};

export default config;
