/* eslint-disable class-methods-use-this */

// external modules
import * as Comlink from 'comlink';

// local
import fetchMany from './fetchMany';
import getDecryptedContent from './getDecryptedContent';

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

  /** Test using getDecryptedContent */
  getDecryptedContent(...args) {
    return getDecryptedContent(...args);
  }
}

Comlink.expose(PenumbraDecryptionWorker);
