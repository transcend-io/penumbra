import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'main.penumbra': path.resolve(__dirname, 'src/index.ts'),
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
      tsconfigPath: './tsconfig.web.json',
      insertTypesEntry: true,
      copyDtsFiles: true,
    }),
  ],
});
