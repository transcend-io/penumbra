/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable class-methods-use-this */

// external modules
import 'regenerator-runtime/runtime';
import * as Comlink from 'comlink';
import {
  fromWritablePort,
  fromReadablePort
} from 'remote-web-streams';

// local
// import encrypt from './encrypt';
import {
  toWebReadableStream
} from 'web-streams-node';
import onProgress from './utils/forwardProgress';
import './transferHandlers/progress';
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
   * @param writablePorts - Remote Web Stream writable ports (for emitting encrypted files)
   * @param readablePorts - Remote Web Stream readable ports (for processing unencrypted files)
   * @returns ReadableStream[] of the encrypted files
   */
  async encrypt(options, readablePorts, writablePorts) {
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
    const decryptionInfo = [];
    readablePorts.forEach(async (readablePort, i) => {
      const stream = fromReadablePort(readablePorts[i]);
      const writable = fromWritablePort(writablePorts[i]);
      const encrypted = encrypt(options, {
        stream,
      });
      const isRS = encrypted.stream instanceof ReadableStream;
      (isRS ? encrypted.stream : toWebReadableStream(encrypted.stream)).pipeTo(
        writable,
      );
      decryptionInfo.push(encrypted.decryptionInfo);
    });
    return decryptionInfo;
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
    onProgress.handler = handler;
  }
}

Comlink.expose(PenumbraEncryptionWorker);
