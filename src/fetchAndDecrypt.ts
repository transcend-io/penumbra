// external modules
import { createDecipheriv } from 'crypto-browserify';

// local
import decryptStream from './decryptStream';
import { RemoteResource } from './types';
import { toBuff } from './utils';

/**
 * Fetches an encrypted file from a URL deciphers it, and returns a ReadableStream
 *
 * @param resource - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
export default function fetchAndDecrypt({
  url,
  decryptionOptions,
  progressEventName = url,
}: RemoteResource): Promise<ReadableStream> {
  return (
    fetch(url)
      // Retrieve its body as ReadableStream
      .then((response) => {
        // Throw an error if we have no body to parse
        if (!response.body) {
          throw new Error('Response body is empty!');
        }

        // If the file is unencrypted, simply return the readable stream
        if (!decryptionOptions) {
          return response.body;
        }

        // Else we need to decrypt the blob
        const { iv, authTag, key } = decryptionOptions;

        // Convert to buffers
        const bufferKey = toBuff(key);
        const bufferIv = toBuff(iv);
        const bufferAuthTag = toBuff(authTag);

        // Construct the decipher
        const decipher = createDecipheriv('aes-256-gcm', bufferKey, bufferIv);
        decipher.setAuthTag(bufferAuthTag);

        // Decrypt the stream
        return decryptStream(
          response.body,
          decipher,
          Number(response.headers.get('Content-Length') || '0'),
          url,
          progressEventName,
        );
      })
  );
}
