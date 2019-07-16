/* eslint-disable class-methods-use-this */

import * as Comlink from 'comlink';
import { getDecryptedContent, decryptStream } from '../build/src/index';

/**
 * Penumbra Worker class
 */
class PenumbraDecryptionWorker {
  /**
   * Get the contents of an encrypted file
   *
   * @param options - FetchDecryptedContentOptions
   * @returns The file contents
   */
  getDecryptedContent(...args) {
    return getDecryptedContent(...args);
  }

  /**
   * Get the contents of an encrypted file
   *
   * @param rs ReadableStream to decode
   * @param decipher Decipher instance
   * @param contentLength Content size
   * @param url URL being requested (for progress events, not fetched )
  progressEventName?: string,
   * @returns Decrypted ReadableStream
   */
  decryptStream(...args) {
    return decryptStream(...args);
  }
}

Comlink.expose(PenumbraDecryptionWorker);
