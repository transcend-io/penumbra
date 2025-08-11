#!/usr/bin/env -S pnpm tsx

/**
 * Vite has an issue where the Web Worker path is not correctly imported.
 * @see https://github.com/vitejs/vite/issues/15618
 *
 * This postbuild script patches the dist files to use the correct path for the worker,
 * by replacing `"/assets/worker.penumbra"` with `"./assets/worker.penumbra"`.
 */

import { readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';

async function patchWebWorkerUrl(
  filePath: string,
  assetPathnameStartsWith = '/assets/worker.penumbra',
) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const content = await readFile(fullPath, 'utf8');
    const patchedContent = content.replaceAll(
      `"${assetPathnameStartsWith}`,
      `".${assetPathnameStartsWith}`,
    );

    if (content === patchedContent) {
      throw new Error(
        `No match found for string: "${assetPathnameStartsWith}"`,
      );
    }

    await writeFile(fullPath, patchedContent, 'utf8');
    console.log(
      `Successfully patched ${filePath} worker URL in postbuild script.`,
    );
  } catch (error: unknown) {
    throw new Error(
      `${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * vite.config.ts dts() reads package.json "types" field to create a d.cts file.
 * We then copy that to a d.ts file (ESM) and patch it to use the correct path for the worker.
 * Switching to something like Rollup might solve this, but realistically we will just deprecate CJS first.
 */
async function createDtsTypes() {
  const ctsPath = path.join(process.cwd(), 'dist/main.penumbra.d.cts');
  const dtsPath = path.join(process.cwd(), 'dist/main.penumbra.d.ts');
  await copyFile(ctsPath, dtsPath);

  const content = await readFile(ctsPath, 'utf8');
  const patchedContent = content.replaceAll(
    / from '(\.\/.*?)'/g,
    (_, a: string) => ` from '${a}.js'`,
  );
  await writeFile(dtsPath, patchedContent, 'utf8');

  console.log(
    `Successfully copied ${ctsPath} to ${dtsPath} in postbuild script.`,
  );
}

async function main() {
  console.group('Postbuild: Patch Web Worker URL');
  try {
    const results = await Promise.allSettled([
      patchWebWorkerUrl('dist/main.penumbra.js'),
      patchWebWorkerUrl('dist/main.penumbra.umd.cjs'),
      createDtsTypes(),
    ]);

    const errors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason as unknown);
    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        'Failed to patch files in postbuild script!',
      );
    }
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
  console.groupEnd();
}

await main();
