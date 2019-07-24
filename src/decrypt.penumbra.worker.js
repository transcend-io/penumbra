/* eslint-disable class-methods-use-this */

// external modules
import * as Comlink from 'comlink';
import { fromWritablePort } from 'remote-web-streams';

// local
import fetchAndDecrypt from './fetchAndDecrypt';

/**
 * Penumbra Decryption Worker class
 */
class PenumbraDecryptionWorker {
  /**
   * Fetches remote files from URLs, deciphers them (if encrypted), and returns ReadableStream[]
   *
   * @param ...resources - The remote resource to download
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
      const remoteStream = fromWritablePort(writablePorts[i]);
      const localStream = await fetchAndDecrypt(resource);
      localStream.pipeTo(remoteStream);
    });
    // return get(...args);
  }

  /** Test using getDecryptedContent */
  getDecryptedContent(...args) {
    return getDecryptedContent(...args);
  }

  /** TODO: remove from worker */
  fetchAndDecrypt(...args) {
    return fetchAndDecrypt(...args);
  }
}

Comlink.expose(PenumbraDecryptionWorker);
