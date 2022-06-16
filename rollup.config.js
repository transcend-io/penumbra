import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

// const name = require('./package.json').main.replace(/\.js$/, '');

const main = (config) => ({
  ...config,
  input: 'src/index.ts',
  external: (id) => !/^[./]/.test(id),
});

const worker = (config) => ({
  ...config,
  input: 'src/worker.penumbra.js',
  external: (id) => !/^[./]/.test(id),
});

export default [
  main({
    plugins: [esbuild()],
    output: [
      {
        dir: 'dist/cjs/',
        format: 'cjs',
        sourcemap: true,
      },
      {
        dir: 'dist/esm/',
        format: 'es',
        sourcemap: true,
      },
    ],
  }),
  worker({
    plugins: [esbuild()],
    output: [
      {
        file: 'dist/cjs/worker.penumbra.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/esm/worker.penumbra.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/umd/worker.penumbra.js',
        format: 'umd',
        sourcemap: true,
      },
    ],
  }),
  main({
    plugins: [dts()],
    output: {
      file: 'dist/types/index.d.ts',
      format: 'es',
    },
  }),
  {
    input: 'src/index.ts',
    plugins: [esbuild()],
    output: [
      {
        file: 'dist/umd/index.js',
        format: 'iife',
        name: 'penumbra',
        inlineDynamicImports: true,
      },
    ],
    sourcemap: true,
  },
];
