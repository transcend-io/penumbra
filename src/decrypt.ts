// external modules
import { createDecryptionStream } from '@transcend-io/encrypt-web-streams';

// utils
import type { JobID } from './types';
import { emitJobCompletion, emitJobProgress } from './utils';

/**
 * Starts a decryption stream with an event emitter
 * @param id - The ID number (for arbitrary decryption) or URL to read the encrypted file from (only used for the event emitter)
 * @param readableStream - A readable stream of encrypted data
 * @param contentLength - The content length of the file, in bytes
 * @param key - Decryption key Uint8Array
 * @param iv - Decryption IV Uint8Array
 * @param authTag - Decryption authTag Uint8Array
 * @param ignoreAuthTag - Dangerously bypass authTag validation. Only use this for testing purposes.
 * @returns A readable stream of decrypted data
 */
export function startDecryptionStreamWithEmitter(
  id: JobID,
  readableStream: ReadableStream,
  contentLength: number | null,
  key: Uint8Array,
  iv: Uint8Array,
  authTag: Uint8Array,
  ignoreAuthTag?: boolean,
): ReadableStream {
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
        emitJobProgress('decrypt', totalBytesRead, contentLength, id);
      },
      flush: () => {
        emitJobCompletion('decrypt', id, { key, iv, authTag });
      },
    }),
  );
}
