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
const iifeOptions = {
  ...sharedOptions,
  ...browserOptions,
  format: 'iife',
  minify: true,
  outdir: './dist/browser/iife/',
  globalName: 'penumbra',
};
build(iifeOptions).catch(() => process.exit(1));

/**
 * @type {import('esbuild').BuildOptions}
 */
const esmOptions = {
  ...sharedOptions,
  ...browserOptions,
  format: 'esm',
  outdir: './dist/browser/esm/',
};
build(esmOptions).catch(() => process.exit(1));

/**
 * @type {import('esbuild').BuildOptions}
 */
const nodeOptions = {
  platform: 'node',
  // target: 'esnext',
  external: ['./node_modules/*'],
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const nodeEsmOptions = {
  ...sharedOptions,
  ...nodeOptions,
  format: 'esm',
  outdir: './dist/node/esm/',
};
build(nodeEsmOptions).catch(() => process.exit(1));

/**
 * @type {import('esbuild').BuildOptions}
 */
const nodeCjsOptions = {
  ...sharedOptions,
  ...nodeOptions,
  format: 'cjs',
  outdir: './dist/node/cjs/',
};
build(nodeCjsOptions).catch(() => process.exit(1));
