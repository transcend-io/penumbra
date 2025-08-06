import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/index.ts',
    'src/worker.penumbra.js',
    'tests/*.test.ts',
    'web-test-runner.config.js',
  ],
  ignore: [
    // Vendored third-party library has some unused exports
    'src/utils/brand.ts',
  ],
  ignoreDependencies: ['@web/test-runner-playwright'],
};

export default config;
