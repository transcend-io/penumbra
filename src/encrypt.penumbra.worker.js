/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable class-methods-use-this */

// external modules
import 'regenerator-runtime/runtime';
import * as Comlink from 'comlink';
import { fromWritablePort, fromReadablePort } from 'remote-web-streams';

// local
// import encrypt from './encrypt';
import onPenumbraEvent from './utils/forwardEvents';
import './transferHandlers/penumbra-events';
import encrypt from './encrypt';

if (self.document) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Penumbra Encryption Worker class
 */
class PenumbraEncryptionWorker {
  /**
   * Streaming encryption of ReadableStreams
   *
   * @param ids - IDs for tracking encryption completion
   * @param writablePorts - Remote Web Stream writable ports (for emitting encrypted files)
   * @param readablePorts - Remote Web Stream readable ports (for processing unencrypted files)
   * @returns ReadableStream[] of the encrypted files
   */
  async encrypt(options, ids, sizes, readablePorts, writablePorts) {
    const writableCount = writablePorts.length;
    const readableCount = readablePorts.length;
    if (writableCount !== readableCount) {
      // eslint-disable-next-line no-multi-assign, no-param-reassign
      readablePorts.length = writablePorts.length = Math.min(
        writableCount,
        readableCount,
        ``,
      );
      console.warn(
        `Readable ports (${writableCount}) <-> Writable ports (${readableCount}) count mismatch. ${
          '' //
        }Truncating to common subset (${writablePorts.length}).`,
      );
    }
    readablePorts.forEach(async (readablePort, i) => {
      const stream = fromReadablePort(readablePorts[i]);
      const writable = fromWritablePort(writablePorts[i]);
      const id = ids[i];
      const size = sizes[i];
      const encrypted = encrypt(options, {
        stream,
        size,
        id,
      });
      encrypted.stream.pipeTo(writable);
    });
  }

  /**
   * Buffered (non-streaming) encryption of ArrayBuffers
   *
   * @param buffers - The file buffers to encrypt
   * @returns ArrayBuffer[] of the encrypted files
   */
  async encryptBuffers(buffers) {
    //
  }

  /**
   * Forward progress events to main thread
   */
  async setup(handler) {
    onPenumbraEvent.handler = handler;
  }
}

Comlink.expose(PenumbraEncryptionWorker);
