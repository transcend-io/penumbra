import { createEncryptionStream } from '@transcend-io/encrypt-web-streams';
import type { CreateEncryptionStreamParameters } from './worker-types.js';

import { emitJobProgress, emitJobCompletion } from './utils/index.js';

/**
 * Encrypts a readable stream with an event emitter
 *
 * @returns A readable stream of encrypted data
 */
export function startEncryptionStreamWithEmitter({
  jobID,
  readableStream,
  contentLength,
  key,
  iv,
}: CreateEncryptionStreamParameters): ReadableStream {
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
        emitJobProgress('encrypt', totalBytesRead, contentLength, jobID);
      },
      flush: () => {
        const authTag = encryptionStream.getAuthTag();
        emitJobCompletion('encrypt', jobID, { key, iv, authTag });
      },
    }),
  );
}
