// external modules
import { createEncryptionStream } from '@transcend-io/encrypt-web-streams';

// local
import type { JobID } from './types';

// utils
import { emitProgress, emitJobCompletion } from './utils';

/**
 * Encrypts a readable stream
 * @param id - Job ID
 * @param readableStream - A readable stream of encrypted data
 * @param contentLength - The content length of the file, in bytes
 * @param key - Encryption key Buffer
 * @param iv - Encryption IV Buffer
 * @returns A readable stream of encrypted data
 */
export function startEncryptionStreamWithEmitter(
  id: JobID<number>,
  readableStream: ReadableStream,
  contentLength: number,
  key: Uint8Array,
  iv: Uint8Array,
): ReadableStream {
  // Construct the encryption stream
  const encryptionStream = createEncryptionStream(key, iv, {
    detachAuthTag: true,
  });

  let totalBytesRead = 0;

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
