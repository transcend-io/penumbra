/* eslint-disable class-methods-use-this */

// external modules
import * as Comlink from 'comlink';

// local
import { RemoteWritableStream, fromWritablePort } from 'remote-web-streams';
import fetchAndDecrypt from './fetchAndDecrypt';
// import get from './get';
import getDecryptedContent from './getDecryptedContent';

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

/**
 * RemoteWebStream connection setup handler
 *
 * @param {MessageEvent} event
 */
function remoteWebStreamHandler(event) {
  if (
    event.data &&
    event.data.penumbra === 'Penumbra RemoteReadableStream setup'
  ) {
    const { writablePort } = event.data;
    const writable = fromWritablePort(writablePort);
  }
}

// eslint-disable-next-line no-restricted-globals
// self.addEventListener('message', remoteWebStreamHandler);

Comlink.expose(PenumbraDecryptionWorker);
