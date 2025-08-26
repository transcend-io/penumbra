import { createDecryptionStream } from '@transcend-io/encrypt-web-streams';
import { emitJobCompletion, emitJobProgress } from './utils/index.js';
import type { CreateDecryptionStreamParameters } from './worker-types.js';
import { logger } from './logger.js';

/**
 * Starts a decryption stream with an event emitter
 *
 * @returns A readable stream of decrypted data
 */
export function startDecryptionStreamWithEmitter({
  jobID,
  readableStream,
  contentLength,
  key,
  iv,
  authTag,
  ignoreAuthTag,
}: CreateDecryptionStreamParameters): ReadableStream {
  // Construct the decryption stream
  const decryptionStream = createDecryptionStream(key, iv, {
    authTag,
    __dangerouslyIgnoreAuthTag: ignoreAuthTag ?? false,
  });

  let totalBytesRead = 0;

  return readableStream.pipeThrough(decryptionStream).pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform: (chunk, controller) => {
        controller.enqueue(chunk);

        // Emit a progress update
        totalBytesRead += chunk.length;
        emitJobProgress('decrypt', totalBytesRead, contentLength, jobID);
      },
      flush: () => {
        logger.debug(
          `penumbra.decrypt(): flush() called after ${totalBytesRead.toString()} bytes read (content-length: ${contentLength?.toString() ?? 'unknown'})`,
          jobID,
        );
        emitJobCompletion('decrypt', jobID, { key, iv, authTag });
      },
    }),
  );
}
