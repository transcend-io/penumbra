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
  // TODO: convert to .ts
  input: 'src/worker.penumbra.js',
  external: (id) => !/^[./]/.test(id),
});

export default [
  main({
    plugins: [esbuild()],
    output: [
      {
        dir: 'dist/main/cjs/',
        format: 'cjs',
        sourcemap: true,
      },
      {
        dir: 'dist/main/esm/',
        format: 'es',
        sourcemap: true,
      },
    ],
  }),
  main({
    plugins: [dts()],
    output: {
      file: 'dist/main/types/index.d.ts',
      format: 'es',
    },
  }),
  worker({
    plugins: [esbuild()],
    output: [
      {
        dir: 'dist/worker/cjs/',
        format: 'cjs',
        sourcemap: true,
      },
      {
        dir: 'dist/worker/esm/',
        format: 'es',
        sourcemap: true,
      },
    ],
  }),
  /**
   * TODO: convert worker to TypeScript
   */
  // worker({
  //   plugins: [dts({ compilerOptions: { allowJs: true } })],
  //   output: {
  //     file: 'dist/worker/types/penumbra.worker.d.ts',
  //     format: 'es',
  //   },
  // }),
];
