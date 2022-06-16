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
  format: 'iife',
  minify: true,
  outdir: './dist/iife/',
  globalName: 'penumbra',
};

build(iifeOptions).catch(() => process.exit(1));

/**
 * @type {import('esbuild').BuildOptions}
 */
const esmOptions = {
  ...sharedOptions,
  format: 'esm',
  outdir: './dist/esm/',
};

build(esmOptions).catch(() => process.exit(1));
