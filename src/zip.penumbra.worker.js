/* eslint-disable class-methods-use-this */

// external
import 'regenerator-runtime/runtime';
import * as Comlink from 'comlink';
import { fromWritablePort } from 'remote-web-streams';

// local
import onProgress from './utils/forwardProgress';
import './transferHandlers/progress';

// eslint-disable-next-line no-restricted-globals
if (self.document) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Penumbra Worker class
 */
class PenumbraZipWorker {
  /**
   * Forward progress events to main thread
   */
  async setup(handler) {
    onProgress.handler = handler;
  }
}

Comlink.expose(PenumbraZipWorker);
