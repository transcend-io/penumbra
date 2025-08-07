#!/usr/bin/env -S pnpm tsx

/**
 * Vite has an issue where the Web Worker path is not correctly imported.
 * @see https://github.com/vitejs/vite/issues/15618
 *
 * This postbuild script patches the dist files to use the correct path for the worker,
 * by replacing `"/assets/worker.penumbra"` with `"./assets/worker.penumbra"`.
 */

import { readFile, writeFile } from 'node:fs/promises';
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

async function main() {
  try {
    const results = await Promise.allSettled([
      patchWebWorkerUrl('dist/main.penumbra.js'),
      patchWebWorkerUrl('dist/main.penumbra.umd.cjs'),
    ]);

    const errors = results.filter((result) => result.status === 'rejected');
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
}

await main();
