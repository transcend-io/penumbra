/* eslint-disable class-methods-use-this */

import * as Comlink from 'comlink';
// import { decryptStream, getDecryptedContent } from 'src/index';

// eslint-disable-next-line no-restricted-globals
if (self.document) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Penumbra Worker class
 */
class PenumbraZipWorker {}

Comlink.expose(PenumbraZipWorker);
