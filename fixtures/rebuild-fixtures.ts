import { createReadStream, createWriteStream } from 'node:fs';
import { readdir, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { createCipheriv, createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

import mime from 'mime';

import { TEST_ENCRYPTION_IV, TEST_ENCRYPTION_KEY } from './constants';
import type { Fixture } from './types';

const thisDirname = import.meta.dirname;

/**
 * Fixtures which are not local, but hosted at https://fixtures-for-conflux-and-penumbra.s3.us-east-1.amazonaws.com
 */
const REMOTE_FIXTURES: Fixture[] = [
  {
    url: '/files/encrypted/big.zip.enc',
    filePrefix: 'big',
    mimetype: 'application/zip',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'pzc0I+7lEAtlI+/PimojZw==',
    },
    unencryptedChecksum:
      'b9528046ceaf6007167fa0569b24a4a9dc14cb70f876667f63c314d166d304b4',
  },
];

/**
 * Rebuild the files.js file to use the local server.
 */
async function main(): Promise<void> {
  const fixtures: Fixture[] = [];
  const files = await readdir(path.join(thisDirname, '/files/unencrypted'));

  // Clear out encrypted folder
  await rm(path.join(thisDirname, '/files/encrypted'), {
    recursive: true,
    force: true,
  });
  await mkdir(path.join(thisDirname, '/files/encrypted'), {
    recursive: true,
  });

  // Loop through all fixtures
  for (const file of files) {
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

    // Get the file size of the encrypted file
    const encryptedFilePath = path.join(thisDirname, encryptedFilePathname);
    const encryptedFileStats = await stat(encryptedFilePath);
    const encryptedFileSize = encryptedFileStats.size;

    // Create a checksum of the unencrypted file
    const unencryptedChecksum = await new Promise<string>((resolve, reject) => {
      const content = createReadStream(
        path.join(thisDirname, '/files/unencrypted', file),
      );
      const hash = createHash('sha256');
      content.on('data', (chunk) => {
        hash.update(chunk);
      });
      content.on('end', () => {
        const unencryptedChecksum = hash.digest('hex');
        resolve(unencryptedChecksum);
      });
      content.on('error', reject);
    });

    fixtures.push({
      url: encryptedFilePathname,
      filePrefix,
      mimetype: mime.getType(file) ?? undefined,
      size: encryptedFileSize,
      decryptionOptions: {
        key: TEST_ENCRYPTION_KEY,
        iv: TEST_ENCRYPTION_IV,
        authTag: cipher.getAuthTag().toString('base64'),
      },
      unencryptedChecksum,
    });
  }

  // Add remote fixtures
  fixtures.push(...REMOTE_FIXTURES);

  await writeFile(
    path.join(thisDirname, 'files/fixtures.json'),
    JSON.stringify(fixtures, null, 2),
  );
  console.debug('Done!');
}

await main();
