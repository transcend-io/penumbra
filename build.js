// @ts-check
const { build } = require('esbuild');

/**
 * @type {import('esbuild').BuildOptions}
 */
const options = {
  entryPoints: ['./src/index.ts'],
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  bundle: true,
  outfile: './dist/penumbra.js',
};

build(options).catch((err) => {
  process.stderr.write(err.stderr);
  process.exit(1);
});
