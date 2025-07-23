/* eslint-disable no-restricted-syntax,no-await-in-loop,no-console */
import { createReadStream, createWriteStream } from 'node:fs';
import { readdir, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { createCipheriv } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

import mime from 'mime-types';

import type { RemoteResource } from '../src/types';
import { TEST_ENCRYPTION_IV, TEST_ENCRYPTION_KEY } from './constants';

const thisDirname = __dirname;

/**
 * Rebuild the files.js file to use the local server.
 */
async function main(): Promise<void> {
  const fixtures: RemoteResource[] = [];
  const dir = await readdir(path.join(thisDirname, '/files/unencrypted'));

  // Clear out encrypted folder
  await rm(path.join(thisDirname, '/files/encrypted'), {
    recursive: true,
    force: true,
  });
  await mkdir(path.join(thisDirname, '/files/encrypted'), {
    recursive: true,
  });

  // Loop through all fixtures
  for (const file of dir) {
    console.debug(`Generating fixture for ${file} ...`);
    const filePrefix = path.basename(file, path.extname(file));
    const encryptedFilePathname = `/files/encrypted/${file}.enc`;

    // Write an encrypted file
    const content = createReadStream(
      path.join(thisDirname, '/files/unencrypted', file),
    );
    const cipher = createCipheriv(
      'aes-256-gcm',
      Buffer.from(TEST_ENCRYPTION_KEY, 'base64'),
      Buffer.from(TEST_ENCRYPTION_IV, 'base64'), // OK to reuse IV for testing since key is already public.
    );
    const writeStream = createWriteStream(
      path.join(thisDirname, encryptedFilePathname),
    );
    await pipeline(content, cipher, writeStream);

    fixtures.push({
      url: encryptedFilePathname,
      filePrefix,
      mimetype: mime.lookup(file) || undefined,
      decryptionOptions: {
        key: TEST_ENCRYPTION_KEY,
        iv: TEST_ENCRYPTION_IV,
        authTag: cipher.getAuthTag().toString('base64'),
      },
    });
  }

  await writeFile(
    path.join(thisDirname, 'files/fixtures.json'),
    JSON.stringify(fixtures, null, 2),
  );
  console.debug('Done!');
}

main();
/* eslint-enable no-restricted-syntax,no-await-in-loop,no-console */
