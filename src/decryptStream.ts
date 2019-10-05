/* tslint:disable completed-docs */

// external modules
import { Decipher } from 'crypto';
import toBuffer from 'typedarray-to-buffer';

// utils
import { emitProgress } from './utils';

/**
 * Decrypts a readable stream
 *
 * TODO check authTag with decipher.final()
 *
 * @param rs - A readable stream of encrypted data
 * @param decipher - The crypto module's decipher
 * @param contentLength - The content length of the file, in bytes
 * @param url - The URL to read the encrypted file from (only used for the event emitter)
 * @returns A readable stream of decrypted data
 */
export default function decryptStream(
  rs: ReadableStream,
  decipher: Decipher,
  contentLength: number,
  url: string,
): ReadableStream {
  let totalBytesRead = 0;

  // TransformStreams are supported
  if ('TransformStream' in self) {
    return rs.pipeThrough(
      // eslint-disable-next-line no-undef
      new TransformStream({
        transform: async (chunk, controller) => {
          const bufferChunk = toBuffer(chunk);

          // Decrypt chunk and send it out
          const decryptedChunk = decipher.update(bufferChunk);
          controller.enqueue(decryptedChunk);

          // Emit a progress update
          totalBytesRead += bufferChunk.length;
          emitProgress('decrypt', totalBytesRead, contentLength, url);
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

          // Decrypt chunk
          const decValue = decipher.update(chunk);

          // Emit a progress update
          totalBytesRead += chunk.length;
          emitProgress('decrypt', totalBytesRead, contentLength, url);

          controller.enqueue(decValue);
          push();
        });
      }
      push();
    },
  });
}
