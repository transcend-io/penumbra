/* eslint-disable class-methods-use-this */

import * as Comlink from 'comlink';
import { getDecryptedContent, downloadEncryptedFile } from '../build/index';

const myValue = 43;
/**
 * Penumbra ServiceWorker class
 */
class PenumbraSW {
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
   * Download an encrypted file
   *
   * @param options - FetchDecryptedContentOptions
   * @returns A promise saving to file
   */
  downloadEncryptedFile(...args) {
    return downloadEncryptedFile(...args);
  }

  /**
   * Log `myValue` to console
   */
  logSomething() {
    console.log(`my value = ${myValue}`);
  }
}

Comlink.expose(PenumbraSW);
