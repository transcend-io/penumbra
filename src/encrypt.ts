import { createEncryptionStream } from '@transcend-io/encrypt-web-streams';
import type { CreateEncryptionStreamParameters } from './worker-types.js';

import { emitJobProgress, emitJobCompletion } from './utils/index.js';
import { logger } from './logger.js';

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
        logger.debug(
          `penumbra.encrypt(): flush() called after ${totalBytesRead.toString()} bytes read (content-length: ${contentLength?.toString() ?? 'unknown'})`,
          jobID,
        );
        const authTag = encryptionStream.getAuthTag();
        emitJobCompletion('encrypt', jobID, { key, iv, authTag });
      },
    }),
  );
}
