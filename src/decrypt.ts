// external modules
import {
  createDecryptionStream,
  type DecryptionStream,
} from '@transcend-io/encrypt-web-streams';

// utils
import {
  PenumbraDecryptionInfo,
  PenumbraEncryptedFile,
  PenumbraFile,
} from './types';
import { emitJobCompletion, emitProgress } from './utils';
import { parseBase64OrUint8Array } from './utils/base64ToUint8Array';

/**
 * Decrypts a readable stream
 * @param stream - A readable stream of encrypted data
 * @param decipher - The crypto module's decipher
 * @param contentLength - The content length of the file, in bytes
 * @param id - The ID number (for arbitrary decryption) or URL to read the encrypted file from (only used for the event emitter)
 * @param key - Decryption key Uint8Array
 * @param iv - Decryption IV Uint8Array
 * @param authTag - Decryption authTag Uint8Array
 * @returns A readable stream of decrypted data
 */
export function decryptStream(
  stream: ReadableStream,
  decipher: DecryptionStream,
  contentLength: number | null,
  id: string | number,
  key: Uint8Array,
  iv: Uint8Array,
  authTag: Uint8Array,
): ReadableStream {
  let totalBytesRead = 0;

  return stream.pipeThrough(decipher).pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform: (chunk, controller) => {
        controller.enqueue(chunk);

        // Emit a progress update
        totalBytesRead += chunk.length;
        emitProgress('decrypt', totalBytesRead, contentLength, id);
      },
      flush: () => {
        emitJobCompletion(id, { key, iv, authTag });
      },
    }),
  );
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

  // Convert to Uint8Array
  const key = parseBase64OrUint8Array(options.key);
  const iv = parseBase64OrUint8Array(options.iv);
  const authTag = parseBase64OrUint8Array(options.authTag);

  // Construct the decipher
  const decipher = createDecryptionStream(key, iv, { authTag });

  // Encrypt the stream
  return {
    ...file,
    id,
    stream: decryptStream(file.stream, decipher, size, id, key, iv, authTag),
  };
}
