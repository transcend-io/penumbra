// external modules
import {
  init,
  createEncryptionStream,
  type EncryptionStream,
} from '@transcend-io/encrypt-web-streams';

// local
import {
  PenumbraDecryptionInfo,
  PenumbraEncryptedFile,
  PenumbraEncryptionOptions,
  PenumbraFileWithID,
  JobID,
} from './types';

// utils
import { emitProgress, emitJobCompletion } from './utils';
import { logger } from './logger';
import { parseBase64OrUint8Array } from './utils/base64ToUint8Array';

// await init();

/**
 * Encrypts a readable stream
 * @param id - Job ID
 * @param rs - A readable stream of encrypted data
 * @param cipher - The crypto module's cipher
 * @param contentLength - The content length of the file, in bytes
 * @param key - Decryption key Buffer
 * @param iv - Decryption IV Buffer
 * @returns A readable stream of decrypted data
 */
export function encryptStream(
  id: JobID<number>,
  readableStream: ReadableStream,
  contentLength: number,
  key: Uint8Array,
  iv: Uint8Array,
): ReadableStream {
  let totalBytesRead = 0;

  // Construct the encryption stream
  const encryptionStream = createEncryptionStream(key, iv, {
    detachAuthTag: true,
  });

  return readableStream.pipeThrough(encryptionStream).pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform: (chunk, controller) => {
        controller.enqueue(chunk);
        totalBytesRead += chunk.length;
        emitProgress('encrypt', totalBytesRead, contentLength, id);
      },
      flush: () => {
        const authTag = encryptionStream.getAuthTag();
        emitJobCompletion(id, { key, iv, authTag });
      },
    }),
  );
}

const GENERATED_KEY_RANDOMNESS = 256;
// Minimum IV randomness set by NIST
const IV_RANDOMNESS = 12;

/**
 * Encrypts a file and returns a ReadableStream
 * @param options - Options
 * @param file - The remote resource to download
 * @param size - Size
 * @returns A readable stream of the deciphered file
 */
export default function encrypt(
  options: PenumbraEncryptionOptions | null,
  file: PenumbraFileWithID,
  size: number,
): PenumbraEncryptedFile {
  // Generate a key if one is not provided
  if (!options || !options.key) {
    logger.debug(
      `penumbra.encrypt(): no key specified. generating a random ${GENERATED_KEY_RANDOMNESS}-bit key`,
    );
    // eslint-disable-next-line no-param-reassign
    options = {
      ...options,
      key: crypto.getRandomValues(new Uint8Array(GENERATED_KEY_RANDOMNESS / 8)),
    };
  }

  const { id } = file;
  // eslint-disable-next-line no-param-reassign
  size = file.size || size;

  // Convert to Uint8Array
  const key = parseBase64OrUint8Array(options.key);
  const iv = (options as PenumbraDecryptionInfo).iv
    ? parseBase64OrUint8Array((options as PenumbraDecryptionInfo).iv)
    : crypto.getRandomValues(new Uint8Array(IV_RANDOMNESS));

  // Encrypt the stream
  return {
    ...file,
    id,
    stream: encryptStream(id, file.stream, size, key, iv),
  };
}
