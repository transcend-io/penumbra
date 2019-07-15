/* eslint-disable class-methods-use-this */

import * as Comlink from 'comlink';
import { getDecryptedContent, downloadEncryptedFile } from '../build/src/index';

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
}

Comlink.expose(PenumbraDecryptionWorker);
