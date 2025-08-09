// external modules
import { createEncryptionStream } from '@transcend-io/encrypt-web-streams';

// local
import type { JobID } from './types';

// utils
import { emitJobProgress, emitJobCompletion } from './utils';

/**
 * Encrypts a readable stream with an event emitter
 * @param id - Job ID
 * @param readableStream - A readable stream of plaintext data
 * @param contentLength - The content length of the file, in bytes
 * @param key - Encryption key Buffer
 * @param iv - Encryption IV Buffer
 * @returns A readable stream of encrypted data
 */
export function startEncryptionStreamWithEmitter(
  id: JobID,
  readableStream: ReadableStream,
  contentLength: number | null,
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
        emitJobProgress('encrypt', totalBytesRead, contentLength, id);
      },
      flush: () => {
        const authTag = encryptionStream.getAuthTag();
        emitJobCompletion('encrypt', id, { key, iv, authTag });
      },
    }),
  );
}
