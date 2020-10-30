// external modules
import { createCipheriv } from 'crypto-browserify';

// local
import { CipherGCM } from 'crypto';
import toBuffer from 'typedarray-to-buffer';
import { TransformStream, fullReadableStreamSupport } from './streams';
import {
  PenumbraDecryptionInfo,
  PenumbraEncryptedFile,
  PenumbraEncryptionOptions,
  PenumbraFileWithID,
} from './types';

// utils
import { emitProgress, toBuff, emitJobCompletion } from './utils';

/* tslint:disable completed-docs */

/**
 * Encrypts a readable stream
 *
 * @param id - Job ID
 * @param rs - A readable stream of encrypted data
 * @param cipher - The crypto module's cipher
 * @param contentLength - The content length of the file, in bytes
 * @param key - Decryption key Buffer
 * @param iv - Decryption IV Buffer
 * @returns A readable stream of decrypted data
 */
export function encryptStream(
  jobID: number,
  rs: ReadableStream,
  cipher: CipherGCM,
  contentLength: number,
  key: Buffer,
  iv: Buffer,
): ReadableStream {
  const stream: ReadableStream = rs;
  let totalBytesRead = 0;

  // TransformStreams are supported
  if (TransformStream && fullReadableStreamSupport) {
    return stream.pipeThrough(
      // eslint-disable-next-line no-undef
      new (TransformStream as typeof self.TransformStream)({
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

          if (totalBytesRead >= contentLength) {
            cipher.final();
            const authTag = cipher.getAuthTag();
            emitJobCompletion(jobID, {
              key,
              iv,
              authTag,
            });
          }
        },
      }),
    );
  }

  // TransformStream not supported, revert to ReadableStream
  const reader = stream.getReader();
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

          controller.enqueue(encryptedChunk);
          push();

          // Emit a progress update
          totalBytesRead += chunk.length;
          emitProgress(
            'encrypt',
            totalBytesRead,
            contentLength,
            '[encrypted file]',
          );

          if (totalBytesRead >= contentLength) {
            cipher.final();
            const authTag = cipher.getAuthTag();
            emitJobCompletion(jobID, {
              key,
              iv,
              authTag,
            });
          }
        });
      }
      push();
    },
  });
}

/** Encrypt a buffer */
export function encryptBuffer(): ArrayBuffer {
  console.error('penumbra encryptBuffer() is not yet implemented');
  return new ArrayBuffer(10);
}

const GENERATED_KEY_RANDOMNESS = 256;
// Minimum IV randomness set by NIST
const IV_RANDOMNESS = 12;

/**
 * Encrypts a file and returns a ReadableStream
 *
 * @param file - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
export default function encrypt(
  options: PenumbraEncryptionOptions | null,
  file: PenumbraFileWithID,
  // eslint-disable-next-line no-undef
  size: number,
): PenumbraEncryptedFile {
  // Generate a key if one is not provided
  if (!options || !options.key) {
    console.debug(
      `penumbra.encrypt(): no key specified. generating a random ${GENERATED_KEY_RANDOMNESS}-bit key`,
    );
    // eslint-disable-next-line no-param-reassign
    options = {
      ...options,
      key: toBuffer(
        crypto.getRandomValues(new Uint8Array(GENERATED_KEY_RANDOMNESS / 8)),
      ),
    };
  }

  const { id } = file;
  // eslint-disable-next-line no-param-reassign
  size = file.size || size;

  // Convert to Buffers
  const key = toBuff(options.key);
  const iv = toBuff(
    (options as PenumbraDecryptionInfo).iv
      ? toBuff((options as PenumbraDecryptionInfo).iv)
      : crypto.getRandomValues(new Uint8Array(IV_RANDOMNESS)),
  );

  // Construct the decipher
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  // Encrypt the stream
  return {
    ...file,
    // stream:
    //   file.stream instanceof ReadableStream
    //     ? encryptStream(file.stream, cipher, size)
    //     : encryptBuffer(file.stream, cipher),
    stream: encryptStream(id, file.stream, cipher, size, key, iv),
    id,
  };
}
