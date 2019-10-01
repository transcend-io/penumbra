// external modules
import { createCipheriv } from 'crypto-browserify';

// local
import { Cipher } from 'crypto';
import toBuffer from 'typedarray-to-buffer';
import {
  PenumbraEncryptedFile,
  PenumbraEncryptionOptions,
  PenumbraFile,
} from './types';

// utils
import { emitProgress, toBuff } from './utils';

/* tslint:disable completed-docs */

// external modules

/**
 * Encrypts a readable stream
 *
 * @param rs - A readable stream of encrypted data
 * @param cipher - The crypto module's cipher
 * @param contentLength - The content length of the file, in bytes
 * @param url - The URL to read the encrypted file from (only used for the event emitter)
 * @returns A readable stream of decrypted data
 */
export function encryptStream(
  rs: ReadableStream,
  cipher: Cipher,
  contentLength: number,
): ReadableStream {
  let totalBytesRead = 0;

  // TransformStreams are supported
  if ('TransformStream' in self) {
    return rs.pipeThrough(
      // eslint-disable-next-line no-undef
      new TransformStream({
        transform: async (chunk, controller) => {
          const bufferChunk = toBuffer(chunk);

          // Encrypt chunk and send it out
          const encryptedChunk = cipher.update(bufferChunk);
          controller.enqueue(encryptedChunk);

          // Emit a progress update
          totalBytesRead += bufferChunk.length;
          emitProgress(
            'encrypt',
            totalBytesRead,
            contentLength,
            '[encrypted file]',
          );
        },
      }),
    );
  }

  // TransformStream not supported, revert to ReadableStream
  const reader = rs.getReader();
  return new ReadableStream({
    /**
     * Controller
     */
    start(controller) {
      /**
       * Push on
       */
      function push(): void {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }

          const chunk = toBuffer(value);

          // Encrypt chunk
          const encryptedChunk = cipher.update(chunk);

          // Emit a progress update
          totalBytesRead += chunk.length;
          emitProgress(
            'encrypt',
            totalBytesRead,
            contentLength,
            '[encrypted file]',
          );

          controller.enqueue(encryptedChunk);
          push();
        });
      }
      push();
    },
  });
}

/** Encrypt a buffer */
export function encryptBuffer(
  buffer: ArrayBuffer,
  cipher: Cipher,
): ArrayBuffer {
  console.error('penumbra encryptBuffer() is not yet implemented');
  return new ArrayBuffer(10);
}

const GENERATED_KEY_RANDOMNESS = 256;
// Minimum IV randomness set by NIST.
// Should this be 16 to align with 256-bit byte boundaries?
const IV_RANDOMNESS = 12;

/**
 * Encrypts a file and returns a ReadableStream
 *
 * @param file - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
export default function encrypt(
  options: PenumbraEncryptionOptions,
  file: PenumbraFile,
  size: number | undefined = file.size,
): PenumbraEncryptedFile {
  if (!size) {
    throw new Error('penumbra.encrypt(): Unable to determine file size');
  }

  if (!options || !options.key) {
    console.log(
      `penumbra.encrypt(): no key specified. generating a random ${GENERATED_KEY_RANDOMNESS}-bit key`,
    );
    // eslint-disable-next-line no-param-reassign
    options = {
      ...options,
      key: Buffer.from(
        crypto.getRandomValues(new Uint8Array(GENERATED_KEY_RANDOMNESS)),
      ),
    };
  }

  // Convert to Buffers
  const key = toBuff(options.key);
  const iv = Buffer.from(crypto.getRandomValues(new Uint8Array(IV_RANDOMNESS)));

  // Construct the decipher
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const authTag = cipher.getAuthTag();
  const decryptionInfo = { key, iv, authTag };

  // Encrypt the stream
  return {
    stream:
      file.stream instanceof ReadableStream
        ? encryptStream(file.stream, cipher, size)
        : encryptBuffer(file.stream, cipher),
    decryptionInfo,
    ...file,
  };
}
