/* eslint-disable class-methods-use-this */

import * as Comlink from 'comlink';

/**
 * Penumbra Worker class
 */
class PenumbraZipWorker {
  /**
   * Testing
   */
  test() {
    return 'test passed';
  }
}

Comlink.expose(PenumbraZipWorker);
