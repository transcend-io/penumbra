import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/index.ts!',
    'src/api.ts!', // knip needs a little help getting past the actual entrypoint
    'src/worker.penumbra.ts!',
    'tests/*.test.ts',
    'web-test-runner.config.js',
  ],
  project: ['src/**', 'fixtures/**', 'tests/**'],
  ignore: [
    // Vendored third-party library has some unused exports
    'src/utils/brand.ts',
    'src/**/*.d.ts',
  ],
  ignoreDependencies: ['@web/test-runner-playwright'],
  // Bypass unlisted binaries "scripts/postbuild.ts package.json"]
  exclude: ['binaries'],
};

export default config;
