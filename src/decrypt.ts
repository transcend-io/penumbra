/* tslint:disable completed-docs */

// external modules
import { DecipherGCM } from 'crypto';
import { createDecipheriv } from 'crypto-browserify';
import toBuffer from 'typedarray-to-buffer';

// utils
import intoStream from 'into-stream';
import { toWebReadableStream } from 'web-streams-node';
import {
  PenumbraDecryptionInfo,
  PenumbraEncryptedFile,
  PenumbraFile,
} from './types';
import { emitProgress, toBuff } from './utils';

/**
 * Decrypts a readable stream
 *
 * @param rs - A readable stream of encrypted data
 * @param decipher - The crypto module's decipher
 * @param contentLength - The content length of the file, in bytes
 * @param id - The ID number (for arbitrary decryption) or URL to read the encrypted file from (only used for the event emitter)
 * @returns A readable stream of decrypted data
 */
export default function decryptStream(
  rs: ReadableStream,
  decipher: DecipherGCM,
  contentLength: number,
  id: string | number,
): ReadableStream {
  const stream: ReadableStream =
    rs instanceof ReadableStream ? rs : toWebReadableStream(rs);
  let totalBytesRead = 0;

  // TransformStreams are supported
  if ('TransformStream' in self) {
    return stream.pipeThrough(
      // eslint-disable-next-line no-undef
      new TransformStream({
        transform: async (chunk, controller) => {
          const bufferChunk = toBuffer(chunk);

          // Decrypt chunk and send it out
          const decryptedChunk = decipher.update(bufferChunk);
          controller.enqueue(decryptedChunk);

          // Emit a progress update
          totalBytesRead += bufferChunk.length;
          emitProgress('decrypt', totalBytesRead, contentLength, id);

          // if (totalBytesRead >= contentLength) {
          //   decipher.final();
          // }
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
  });
}

/**
 * Decrypts a file and returns a ReadableStream
 *
 * @param file - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
export function decrypt(
  options: PenumbraDecryptionInfo,
  file: PenumbraEncryptedFile,
  // eslint-disable-next-line no-undef
  size: number,
): PenumbraFile {
  if (!options || !options.key || !options.iv || !options.authTag) {
    throw new Error('penumbra.decrypt(): missing decryption options');
  }

  const { id } = file;
  // eslint-disable-next-line no-param-reassign
  size = file.size || size;

  // Convert to Buffers
  const key = options.key instanceof Buffer ? options.key : toBuff(options.key);
  const iv =
    options.iv instanceof Buffer ? options.iv : Buffer.from(options.iv);
  const authTag =
    options.authTag instanceof Buffer
      ? options.authTag
      : toBuff(options.authTag);

  // Construct the decipher
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  // Encrypt the stream
  return {
    ...file,
    // stream:
    //   file.stream instanceof ReadableStream
    //     ? encryptStream(file.stream, cipher, size)
    //     : encryptBuffer(file.stream, cipher),
    stream: decryptStream(
      file.stream instanceof ReadableStream
        ? file.stream
        : ((intoStream(file.stream) as unknown) as ReadableStream),
      /** TODO: address this TypeScript confusion  */
      decipher,
      size,
      id,
    ),
    id,
  };
}
