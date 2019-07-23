/* eslint-disable class-methods-use-this */

import * as Comlink from 'comlink';
import { fetchMany } from '@transcend-io/penumbra';

/**
 * Penumbra Decryption Worker class
 */
class PenumbraDecryptionWorker {
  /**
   * Fetches a remote file from a URL, deciphers it (if encrypted), and returns a ReadableStream
   *
   * @param resource - The remote resource to download
   * @returns A readable stream of the deciphered file
   */
  fetchMany(...args) {
    return fetchMany(...args);
  }
}

Comlink.expose(PenumbraDecryptionWorker);
