/* tslint:disable completed-docs */

// external modules
import { Decipher } from 'crypto';
import toBuffer from 'typedarray-to-buffer';

// Comlink
import * as Comlink from 'comlink';

// utils
import { emitProgress } from './utils';

/**
 * Decrypts a readable stream
 *
 * TODO check authTag with decipher.final
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
  progressEventName?: string,
): ReadableStream {
  let totalBytesRead = 0;

  // TransformStreams are supported
  // eslint-disable-next-line no-restricted-globals
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
          emitProgress(totalBytesRead, contentLength, url, progressEventName);
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
          emitProgress(totalBytesRead, contentLength, url, progressEventName);

          controller.enqueue(decValue);
          push();
        });
      }
      push();
    },
  });
}

const workerCache = JSON.parse(localStorage.workerCache || '[]');

/**
 * De-allocate temporary Worker object URLs
 */
function cleanup(): void {
  workerCache.forEach((url: string) => {
    URL.revokeObjectURL(url);
  });
  workerCache.length = 0;
  localStorage.workerCache = JSON.stringify(workerCache);
}

const workerURL = URL.createObjectURL(
  new Blob(
    [
      `importScripts("https://unpkg.com/comlink@4.0.1/dist/umd/comlink.js");
    ${decryptStream.toString()}
    const state = {
      decryptStream,
      currentCount: 0,
      inc() {
        this.currentCount++;
      }
    };
    console.log(decryptStream);
    Comlink.expose(state);`,
    ],
    {
      type: 'application/ecmascript',
    },
  ),
);

workerCache.push(workerURL);

export const worker = Comlink.wrap(new Worker(workerURL));

console.log(worker);

window.addEventListener('beforeunload', cleanup);
