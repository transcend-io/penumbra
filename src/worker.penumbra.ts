import type { RemoteResource, JobID } from './types';

/**
 * Penumbra Worker
 * Fetch and decrypt files in the browser using whatwg streams and web workers.
 * @author Transcend Inc. <https://transcend.io>
 * @license Apache-2.0
 */

/* eslint-disable class-methods-use-this */
import { expose } from 'comlink';
import { fromWritablePort, fromReadablePort } from 'remote-web-streams';
import { init } from '@transcend-io/encrypt-web-streams';

// local
import fetchAndDecrypt from './fetchAndDecrypt';
import onPenumbraEvent from './utils/forwardEvents';
import './transferHandlers/penumbra-events';
import { startEncryptionStreamWithEmitter } from './encrypt';
import { startDecryptionStreamWithEmitter } from './decrypt';
import { setWorkerID } from './worker-id';
import { logger } from './logger';
import emitError from './utils/emitError';
import { PenumbraError } from './error';

if (self.document) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Penumbra Worker class
 */
class PenumbraWorker {
  /**
   * Fetches remote files from URLs, deciphers them (if encrypted), and returns ReadableStream[]
   * @param writablePorts - Remote Web Stream writable ports
   * @param resources - The remote resource to download
   */
  async get(
    writablePorts: MessagePort[],
    resources: RemoteResource[],
  ): Promise<void> {
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
      const errors: PenumbraError[] = [];
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          const err = new PenumbraError(result.reason, resources[i].url);
          emitError(err);
          errors.push(err);
        }
      });
      if (errors.length > 0) {
        throw new PenumbraError(
          `${errors.length} file${
            errors.length === 1 ? '' : 's'
          } failed to fetch and decrypt:
${errors.map((err) => `${err.message} (${err.id})`).join('\n')}`,
          'get',
        );
      }
    } catch (error: unknown) {
      if (error instanceof PenumbraError) {
        emitError(error);
        logger.error(error);
        throw error;
      }
      emitError(
        new PenumbraError(
          error instanceof Error ? error : new Error(String(error)),
          'get',
        ),
      );
      logger.error(error);
      throw error;
    }
  }

  /**
   * Streaming decryption of ReadableStreams
   * @param key - Decryption key
   * @param iv - Decryption IV
   * @param authTag - Decryption authTag
   * @param id - ID for tracking decryption completion
   * @param size - File size in bytes
   * @param readablePort - Remote Web Stream readable port (for processing encrypted files)
   * @param writablePort - Remote Web Stream writable port (for emitting decrypted files)
   */
  async decrypt(
    key: Uint8Array,
    iv: Uint8Array,
    authTag: Uint8Array,
    id: JobID<number>,
    size: number,
    readablePort: MessagePort,
    writablePort: MessagePort,
  ): Promise<void> {
    // Stream of encrypted bytes flowing from main thread
    const remoteReadableStream = fromReadablePort(readablePort);
    // The destination to send encrypted bytes to the main thread
    const remoteWritableStream = fromWritablePort(writablePort);

    // Start the decryption stream with an event emitter
    const decryptionStreamWithEmitter = startDecryptionStreamWithEmitter(
      id,
      remoteReadableStream,
      size,
      key,
      iv,
      authTag,
    );

    await decryptionStreamWithEmitter.pipeTo(remoteWritableStream);
  }

  /**
   * Streaming encryption of ReadableStreams
   * @param key - Encryption key
   * @param iv - Encryption IV
   * @param id - ID for tracking encryption completion
   * @param size - File size in bytes
   * @param readablePort - Remote Web Stream readable port (for processing unencrypted files)
   * @param writablePort - Remote Web Stream writable port (for emitting encrypted files)
   */
  async encrypt(
    key: Uint8Array,
    iv: Uint8Array,
    id: JobID<number>,
    size: number, // TODO this should just be on the file object
    readablePort: MessagePort,
    writablePort: MessagePort,
  ): Promise<void> {
    // Stream of plaintext bytes flowing from main thread
    const remoteReadableStream = fromReadablePort(readablePort);

    // The destination to send encrypted bytes to the main thread
    const remoteWritableStream = fromWritablePort(writablePort);

    // Start the encryption stream with an event emitter
    const encryptionStreamWithEmitter = startEncryptionStreamWithEmitter(
      id,
      remoteReadableStream,
      size,
      key,
      iv,
    );

    // Start the encryption stream with an event emitter
    await encryptionStreamWithEmitter.pipeTo(remoteWritableStream);
  }

  /**
   * Forward events to main thread
   * @param id - Worker ID
   * @param handler - handler
   */
  async setup(id: number, handler: (event: Event) => void): Promise<void> {
    // Initialize the Wasm from the encrypt-web-streams library
    await init();
    setWorkerID(id);
    onPenumbraEvent.handler = handler;
  }
}

/**
 * The Penumbra Worker API
 */
export type { PenumbraWorker };

/**
 * Expose the PenumbraWorker class to the main thread
 */
expose(PenumbraWorker);
/* eslint-enable class-methods-use-this */
