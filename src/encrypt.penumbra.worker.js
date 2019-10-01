/* eslint-disable class-methods-use-this */

// external modules
import 'regenerator-runtime/runtime';
import * as Comlink from 'comlink';
import { fromWritablePort, fromReadablePort } from 'remote-web-streams';

// local
// import encrypt from './encrypt';
import onProgress from './utils/forwardProgress';
import './transferHandlers/progress';
import encryptStream from './encrypt';

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
  async encrypt(readablePorts, writablePorts) {
    const writableCount = writablePorts.length;
    const readableCount = readablePorts.length;
    if (writableCount !== readableCount) {
      // eslint-disable-next-line no-multi-assign, no-param-reassign
      readablePorts.length = writablePorts.length = Math.min(
        writableCount,
        readableCount,
      );
      console.warn(
        `Readable ports (${writableCount}) <-> Writable ports (${readableCount}) count mismatch. ${
          '' //
        }Truncating to common subset (${writablePorts.length}).`,
      );
    }
    readablePorts.forEach(async (readablePort, i) => {
      const readable = fromReadablePort(readablePorts[i]);
      const writable = fromWritablePort(writablePorts[i]);
      readable.pipeThrough(encryptStream()).pipeTo(writable);
      // if (!('url' in resource)) {
      //   throw new Error(
      //     'PenumbraEncryptionWorker.get(): RemoteResource missing URL',
      //   );
      // }
      // const remoteStream = fromWritablePort(writablePorts[i]);
      // const localStream = await fetchAndDecrypt(resource);
      // localStream.pipeTo(remoteStream);
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
    onProgress.handler = handler;
  }
}

Comlink.expose(PenumbraEncryptionWorker);
