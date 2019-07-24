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
    return fetchMany.apply(this, args);
  }

  /** Test using getDecryptedContent */
  getDecryptedContent(...args) {
    return getDecryptedContent(...args);
  }

  /** Create RemoteReadableStreams for main thread */
  createReadStreams(...args) {
    return;
  }

  /* public */ remoteStreamPorts = [];
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

  }
}

// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', remoteWebStreamHandler);

Comlink.expose(PenumbraDecryptionWorker);
