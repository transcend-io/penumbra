import { RemoteResource } from './types';
/**
 * Fetches a remote file from a URL, deciphers it (if encrypted), and returns a ReadableStream
 *
 * @param resource - The remote resource to download
 * @param fetchOptions - Options to include in the download URL fetch. Set to `{ credentials: 'include' }` to include credentials for a CORS request.
 * @returns A readable stream of the deciphered file
 */
export default function fetchAndDecrypt({ url, decryptionOptions }: RemoteResource, fetchOptions?: RequestInit): Promise<ReadableStream>;
//# sourceMappingURL=fetchAndDecrypt.d.ts.map