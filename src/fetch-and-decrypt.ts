// local
import type { RemoteResource, JobID } from './types.js';
import { startDecryptionStreamWithEmitter } from './decrypt.js';

// utils
import { parseBase64OrUint8Array } from './utils/index.js';

/**
 * Fetches a remote file from a URL, deciphers it (if encrypted), and returns a ReadableStream
 * @param jobID - Job ID
 * @param resource - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
export default async function fetchAndDecrypt(
  jobID: JobID,
  {
    url,
    decryptionOptions,
    requestInit,
    /** Dangerously bypass authTag validation. Only use this for testing purposes. */
    ignoreAuthTag = false,
  }: RemoteResource,
): Promise<ReadableStream> {
  const response = await fetch(url, requestInit);

  if (response.status >= 400) {
    throw new Error(
      `Received invalid status code: ${response.status.toString()} -- ${response.statusText}`,
    );
  }

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

  // Convert to Uint8Array
  const bufferKey = parseBase64OrUint8Array(key);
  // Grab from header if possible
  const bufferIv = parseBase64OrUint8Array(
    response.headers.get('x-penumbra-iv') ?? iv,
  );
  const bufferAuthTag = parseBase64OrUint8Array(authTag);

  // Decrypt the stream
  return startDecryptionStreamWithEmitter(
    jobID,
    response.body,
    Number(response.headers.get('Content-Length')) || null,
    bufferKey,
    bufferIv,
    bufferAuthTag,
    ignoreAuthTag,
  );
}
