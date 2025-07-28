import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: {
        main: resolve(__dirname, 'src/index.ts'),
        worker: resolve(__dirname, 'src/worker.penumbra.js'),
      },
      name: 'Penumbra',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          // vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
