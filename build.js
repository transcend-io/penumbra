const {
  NodeGlobalsPolyfillPlugin,
} = require('@esbuild-plugins/node-globals-polyfill');

const { build } = require('esbuild');

/**
 * @type {import('esbuild').BuildOptions}
 */
const sharedOptions = {
  entryPoints: ['./src/index.ts', './src/worker.penumbra.js'],
  sourcemap: true,
  bundle: true,
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const browserOptions = {
  platform: 'browser',
  plugins: [
    NodeGlobalsPolyfillPlugin({
      process: true,
      buffer: true,
    }),
  ],
  define: {
    global: 'globalThis',
  },
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const cjsOptions = {
  ...sharedOptions,
  ...browserOptions,
  format: 'iife',
  minify: true,
  outdir: './dist/cjs/',
  globalName: 'penumbra',
};
build(cjsOptions).catch(() => process.exit(1));

/**
 * @type {import('esbuild').BuildOptions}
 */
const esmOptions = {
  ...sharedOptions,
  ...browserOptions,
  format: 'esm',
  outdir: './dist/esm/',
};
build(esmOptions).catch(() => process.exit(1));
