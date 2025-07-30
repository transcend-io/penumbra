// @ts-check
/**
 * @typedef {import('./types').PenumbraWorkerAPI} PenumbraWorkerAPI
 * @typedef {import('./types').RemoteResource} RemoteResource
 * @typedef {import('./types').PenumbraEncryptionOptions} PenumbraEncryptionOptions
 * @typedef {import('./types').PenumbraDecryptionInfo} PenumbraDecryptionInfo
 * @typedef {import('./types').PenumbraFile} PenumbraFile
 * @typedef {import('./types').PenumbraDecryptionInfoAsBuffer} PenumbraDecryptionInfoAsBuffer
 * @typedef {import('./zip').PenumbraZipWriter} PenumbraZipWriter
 * @typedef {import('./enums').PenumbraSupportLevel} PenumbraSupportLevel
 */

/**
 * Penumbra Worker
 * Fetch and decrypt files in the browser using whatwg streams and web workers.
 * @author Transcend Inc. <https://transcend.io>
 * @license Apache-2.0
 */

/* eslint-disable class-methods-use-this */
import { expose } from 'comlink';
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
import { logger } from './logger';
import emitError from './utils/emitError';
import { PenumbraError } from './error';

if (self.document && !self.isTest) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Penumbra Worker class
 * @implements {PenumbraWorkerAPI}
 */
class PenumbraWorker {
  /**
   * Fetches remote files from URLs, deciphers them (if encrypted), and returns ReadableStream[]
   * @param writablePorts - Remote Web Stream writable ports
   * @param resources - The remote resource to download
   */
  async get(writablePorts, resources) {
    const writableCount = writablePorts.length;
    const resourceCount = resources.length;
    if (writableCount !== resourceCount) {
      // eslint-disable-next-line no-multi-assign, no-param-reassign
      resources.length = writablePorts.length = Math.min(
        writableCount,
        resourceCount,
      );
      logger.warn(
        `Writable ports (${writableCount}) <-> Resources (${resourceCount}) count mismatch. ${
          '' //
        }Truncating to common subset (${writablePorts.length}).`,
      );
    }

    try {
      // Await successful fetch response (but do not await the pipeTo). i.e., await server reply, but not the whole body
      const results = await Promise.allSettled(
        resources.map(async (resource, i) => {
          if (!('url' in resource)) {
            throw new Error(
              'PenumbraDecryptionWorker.get(): RemoteResource missing URL',
            );
          }
          const remoteStream = fromWritablePort(writablePorts[i]);
          const localStream = await fetchAndDecrypt(resource);
          localStream.pipeTo(remoteStream);
        }),
      );

      // Emit an error for each failed fetch
      const errors = [];
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          const err = new PenumbraError(result.reason, resources[i].url);
          emitError(err);
          errors.push(err);
        }
      });
      if (errors.length > 0) {
        throw new PenumbraError(
          `${errors.length} file${errors.length === 1 ? '' : 's'} failed to fetch and decrypt:
${errors.map((err) => `${err.message} (${err.id})`).join('\n')}`,
          'get',
        );
      }
    } catch (error) {
      emitError(error);
      logger.error(error);
      throw error;
    }
  }

  // /**
  //  * Fetches remote files from URLs, deciphers them (if encrypted),
  //  * fully buffers the response, and returns ArrayBuffer[]
  //  * @param resources - The remote resources to download
  //  * @returns ArrayBuffer[] of the deciphered files
  //  */
  // getBuffers(resources) {
  //   return Promise.all(
  //     resources.map((resource) => {
  //       if (!('url' in resource)) {
  //         throw new Error(
  //           'PenumbraDecryptionWorker.getBuffers(): RemoteResource missing URL',
  //         );
  //       }
  //       return fetchAndDecrypt(resource).then((stream) =>
  //         new Response(stream)
  //           .arrayBuffer()
  //           .then((buffer) => transfer(buffer, [buffer])),
  //       );
  //     }),
  //   );
  // }

  /**
   * Streaming decryption of ReadableStreams
   * @param options - Options
   * @param ids - IDs for tracking decryption completion
   * @param sizes - Sizes
   * @param readablePorts - Remote Web Stream readable ports (for processing encrypted files)
   * @param writablePorts - Remote Web Stream writable ports (for emitting decrypted files)
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
      logger.warn(
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
   * @param options - Options
   * @param ids - IDs for tracking encryption completion
   * @param sizes - Sizes
   * @param readablePorts - Remote Web Stream readable ports (for processing unencrypted files)
   * @param writablePorts - Remote Web Stream writable ports (for emitting encrypted files)
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
      logger.warn(
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

  // /**
  //  * Buffered (non-streaming) encryption of ArrayBuffers
  //  */
  // encryptBuffers() {
  //   //
  // }

  /**
   * Forward events to main thread
   * @param id - ID
   * @param handler - handler
   */
  setup(id, handler) {
    setWorkerID(id);
    onPenumbraEvent.handler = handler;
  }
}

expose(PenumbraWorker);
/* eslint-enable class-methods-use-this */
