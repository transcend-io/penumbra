/**
 * Penumbra Worker
 * Fetch and decrypt files in the browser using whatwg streams and web workers.
 *
 * @author Transcend Inc. <https://transcend.io>
 * @license Apache 2.0
 */

/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable class-methods-use-this */
import { transfer, expose } from 'comlink';
import {
  fromWritablePort,
  fromReadablePort,
} from '@transcend-io/remote-web-streams';

// local
import fetchAndDecrypt from './fetchAndDecrypt';
import onPenumbraEvent from './utils/forwardEvents';
import './transferHandlers/penumbra-events';
import encrypt from './encrypt';
import decrypt from './decrypt';
import { setWorkerID } from './worker-id';

if (self.document) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Penumbra Worker class
 */
class PenumbraWorker {
  /**
   * Fetches remote files from URLs, deciphers them (if encrypted), and returns ReadableStream[]
   *
   * @param writablePorts - Remote Web Stream writable ports
   * @param resources - The remote resource to download
   * @returns ReadableStream[] of the deciphered files
   */
  get(writablePorts, resources) {
    const writableCount = writablePorts.length;
    const resourceCount = resources.length;
    if (writableCount !== resourceCount) {
      // eslint-disable-next-line no-multi-assign, no-param-reassign
      resources.length = writablePorts.length = Math.min(
        writableCount,
        resourceCount,
      );
      console.warn(
        `Writable ports (${writableCount}) <-> Resources (${resourceCount}) count mismatch. ${
          '' //
        }Truncating to common subset (${writablePorts.length}).`,
      );
    }
    resources.forEach((resource, i) => {
      if (!('url' in resource)) {
        throw new Error(
          'PenumbraDecryptionWorker.get(): RemoteResource missing URL',
        );
      }
      const remoteStream = fromWritablePort(writablePorts[i]);
      fetchAndDecrypt(resource).then((localStream) => {
        localStream.pipeTo(remoteStream);
      });
    });
  }

  /**
   * Fetches remote files from URLs, deciphers them (if encrypted),
   * fully buffers the response, and returns ArrayBuffer[]
   *
   * @param resources - The remote resource to download
   * @returns ArrayBuffer[] of the deciphered files
   */
  getBuffers(resources) {
    return Promise.all(
      resources.map((resource) => {
        if (!('url' in resource)) {
          throw new Error(
            'PenumbraDecryptionWorker.getBuffers(): RemoteResource missing URL',
          );
        }
        return fetchAndDecrypt(resource).then((stream) =>
          new Response(stream)
            .arrayBuffer()
            .then((buffer) => transfer(buffer, buffer)),
        );
      }),
    );
  }

  /**
   * Streaming decryption of ReadableStreams
   *
   * @param options
   * @param ids - IDs for tracking decryption completion
   * @param sizes
   * @param writablePorts - Remote Web Stream writable ports (for emitting decrypted files)
   * @param readablePorts - Remote Web Stream readable ports (for processing encrypted files)
   * @returns ReadableStream[] of the decrypted files
   */
  decrypt(options, ids, sizes, readablePorts, writablePorts) {
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
    readablePorts.forEach((readablePort, i) => {
      const stream = fromReadablePort(readablePorts[i]);
      const writable = fromWritablePort(writablePorts[i]);
      const id = ids[i];
      const size = sizes[i];
      const decrypted = decrypt(
        options,
        {
          stream,
          size,
          id,
        },
        size,
      );
      decrypted.stream.pipeTo(writable);
    });
  }

  /**
   * Streaming encryption of ReadableStreams
   *
   * @param options
   * @param ids - IDs for tracking encryption completion
   * @param sizes
   * @param writablePorts - Remote Web Stream writable ports (for emitting encrypted files)
   * @param readablePorts - Remote Web Stream readable ports (for processing unencrypted files)
   * @returns ReadableStream[] of the encrypted files
   */
  encrypt(options, ids, sizes, readablePorts, writablePorts) {
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
      const stream = fromReadablePort(readablePorts[i]);
      const writable = fromWritablePort(writablePorts[i]);
      const id = ids[i];
      const size = sizes[i];
      const encrypted = encrypt(
        options,
        {
          stream,
          size,
          id,
        },
        size,
      );
      encrypted.stream.pipeTo(writable);
    });
  }

  /**
   * Buffered (non-streaming) encryption of ArrayBuffers
   *
   * @param buffers - The file buffers to encrypt
   * @returns ArrayBuffer[] of the encrypted files
   */
  encryptBuffers() {
    //
  }

  /**
   * Forward events to main thread
   *
   * @param id
   * @param handler
   */
  setup(id, handler) {
    setWorkerID(id);
    onPenumbraEvent.handler = handler;
  }
}

expose(PenumbraWorker);
