/* eslint-disable class-methods-use-this */

// external modules
import 'regenerator-runtime/runtime';
import * as Comlink from 'comlink';
import { fromWritablePort } from 'remote-web-streams';

// local
import fetchAndDecrypt from './fetchAndDecrypt';
import onProgress from './utils/forwardProgress';
import './transferHandlers/progress';

if (self.document) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Penumbra Decryption Worker class
 */
class PenumbraDecryptionWorker {
  /**
   * Fetches remote files from URLs, deciphers them (if encrypted), and returns ReadableStream[]
   *
   * @param writablePorts - Remote Web Stream writable ports
   * @param resources - The remote resource to download
   * @returns ReadableStream[] of the deciphered files
   */
  async get(writablePorts, resources) {
    const writableCount = writablePorts.length;
    const resourceCount = resources.length;
    if (writableCount !== resourceCount) {
      console.warn(
        'Writable ports <-> Resources count mismatch. Truncating to common subset.',
      );
      // eslint-disable-next-line no-multi-assign, no-param-reassign
      resources.length = writablePorts.length = Math.min(
        writableCount,
        resourceCount,
      );
    }
    resources.forEach(async (resource, i) => {
      if (!('url' in resource)) {
        throw new Error('penumbra.get(): RemoteResource missing URL');
      }
      const remoteStream = fromWritablePort(writablePorts[i]);
      const localStream = await fetchAndDecrypt(resource);
      localStream.pipeTo(remoteStream);
    });
  }

  /**
   * Forward progress events to main thread
   */
  async setup(handler) {
    onProgress.handler = handler;
  }
}

Comlink.expose(PenumbraDecryptionWorker);
