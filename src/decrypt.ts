// external modules
import { DecipherGCM } from 'crypto';
import { createDecipheriv } from 'crypto-browserify';
import toBuffer from 'typedarray-to-buffer';

import { TransformStream } from './streams';

// utils
import {
  PenumbraDecryptionInfo,
  PenumbraEncryptedFile,
  PenumbraFile,
} from './types';
import { emitJobCompletion, emitProgress, toBuff } from './utils';
import emitError from './utils/emitError';
import { logger } from './logger';
import { PenumbraError } from './error';

/**
 * Decrypts a readable stream
 * @param stream - A readable stream of encrypted data
 * @param decipher - The crypto module's decipher
 * @param contentLength - The content length of the file, in bytes
 * @param id - The ID number (for arbitrary decryption) or URL to read the encrypted file from (only used for the event emitter)
 * @param key - Decryption key Buffer
 * @param iv - Decryption IV Buffer
 * @param authTag - Decryption authTag Buffer
 * @param ignoreAuthTag - Whether to ignore it
 * @returns A readable stream of decrypted data
 */
export function decryptStream(
  stream: ReadableStream,
  decipher: DecipherGCM,
  contentLength: number | null,
  id: string | number,
  key: Buffer,
  iv: Buffer,
  authTag: Buffer,
  ignoreAuthTag = false,
): ReadableStream {
  let totalBytesRead = 0;

  // TransformStreams are supported
  if ('TransformStream' in self) {
    return stream.pipeThrough(
      new (TransformStream as typeof self.TransformStream)({
        transform: (chunk, controller) => {
          const bufferChunk = toBuffer(chunk);

          // Decrypt chunk and send it out
          const decryptedChunk = decipher.update(bufferChunk);
          controller.enqueue(decryptedChunk);

          // Emit a progress update
          totalBytesRead += bufferChunk.length;
          emitProgress('decrypt', totalBytesRead, contentLength, id);
        },
        flush: (controller) => {
          // Finalize decryption when stream is done
          if (!ignoreAuthTag) {
            const final = decipher.final();
            if (final.length > 0) {
              controller.enqueue(final);
            }
          }
          emitJobCompletion(id, { key, iv, authTag });
        },
      }),
    );
  }

  let finished = false;
  // TransformStream not supported, revert to ReadableStream
  const reader = stream.getReader();
  return new ReadableStream({
    /**
     * Controller
     * @param controller - Controller
     */
    start(controller) {
      /**
       * Push on
       */
      function push(): void {
        reader.read().then(({ done, value }) => {
          if (done) {
            if (!ignoreAuthTag) {
              decipher.final();
            }
            if (!finished) {
              controller.close();
              finished = true;
            }
            emitJobCompletion(id, { key, iv, authTag });
            return;
          }

          const chunk = toBuffer(value);

          // Decrypt chunk
          const decValue = decipher.update(chunk);

          // Emit a progress update
          totalBytesRead += chunk.length;
          emitProgress('decrypt', totalBytesRead, contentLength, id);

          controller.enqueue(decValue);
          push();
        });
      }
      push();
    },
    /**
     * On cancel of the decryption stream, throw an error
     * @param reason - The reason for the cancellation
     */
    async cancel(reason) {
      const err = new PenumbraError(
        `Decryption stream was cancelled: ${reason}`,
        id,
      );
      logger.error(err);
      await reader.cancel(err);
      emitError(err);
      throw err;
    },
  });
}

/**
 * Decrypts a file and returns a ReadableStream
 * @param options - Options
 * @param file - The remote resource to download
 * @param size - Size
 * @returns A readable stream of the deciphered file
 */
export default function decrypt(
  options: PenumbraDecryptionInfo,
  file: PenumbraEncryptedFile,
  size: number,
): PenumbraFile {
  if (!options || !options.key || !options.iv || !options.authTag) {
    throw new Error('penumbra.decrypt(): missing decryption options');
  }

  const { id } = file;
  // eslint-disable-next-line no-param-reassign
  size = file.size || size;

  // Convert to Buffers
  const key = toBuff(options.key);
  const iv = toBuff(options.iv);
  const authTag = toBuff(options.authTag);

  // Construct the decipher
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  // Encrypt the stream
  return {
    ...file,
    id,
    stream: decryptStream(
      file.stream,
      decipher,
      size,
      id,
      key,
      iv,
      authTag,
      file.ignoreAuthTag,
    ),
  };
}
