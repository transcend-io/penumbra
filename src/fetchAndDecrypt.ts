/* eslint-disable import/extensions */
// external modules
import { createDecipheriv } from 'crypto-browserify';

// local
import { RemoteResource } from './types';
import { decryptStream } from './decrypt';
import { PenumbraError } from './error';
import { toBuff } from './utils';
import emitError from './utils/emitError';

/**
 * Fetches a remote file from a URL, deciphers it (if encrypted), and returns a ReadableStream
 *
 * @param resource - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
export default function fetchAndDecrypt({
  url,
  decryptionOptions,
  requestInit,
}: RemoteResource): Promise<ReadableStream> {
  return (
    fetch(url, requestInit)
      // Retrieve ReadableStream body
      .then((response) => {
        if (response.status >= 400) {
          const err = new PenumbraError(
            `Received invalid status code: ${response.status} -- ${response.body}`,
            url,
          );
          emitError(err);
          throw err;
        }

        // Throw an error if we have no body to parse
        if (!response.body) {
          const err = new PenumbraError('Response body is empty!', url);
          emitError(err);
          throw err;
        }

        // If the file is unencrypted, simply return the readable stream
        if (!decryptionOptions) {
          return response.body;
        }

        // Else we need to decrypt the blob
        const { iv, authTag, key } = decryptionOptions;

        // Convert to buffers
        const bufferKey = toBuff(key);
        // Grab from header if possible
        const bufferIv =
          iv instanceof Buffer
            ? iv
            : toBuff(response.headers.get('x-penumbra-iv') || iv);
        const bufferAuthTag = toBuff(authTag);

        // Construct the decipher
        const decipher = createDecipheriv('aes-256-gcm', bufferKey, bufferIv);
        decipher.setAuthTag(bufferAuthTag);

        // Decrypt the stream
        return decryptStream(
          response.body,
          decipher,
          Number(response.headers.get('Content-Length') || 0),
          url,
          bufferKey,
          bufferIv,
          bufferAuthTag,
        );
      })
  );
}
