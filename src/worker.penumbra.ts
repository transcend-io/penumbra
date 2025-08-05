import type {
  RemoteResource,
  PenumbraEncryptionOptions,
  PenumbraDecryptionInfo,
  JobID,
} from './types';

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
import { parseBase64OrUint8Array } from './utils/base64ToUint8Array';

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
   * @param options - Options
   * @param id - ID for tracking decryption completion
   * @param size - File size in bytes
   * @param readablePort - Remote Web Stream readable port (for processing encrypted files)
   * @param writablePort - Remote Web Stream writable port (for emitting decrypted files)
   */
  async decrypt(
    options: PenumbraDecryptionInfo,
    id: JobID<number>,
    size: number, // TODO this should just be on the file object
    readablePort: MessagePort,
    writablePort: MessagePort,
  ): Promise<void> {
    // Stream of encrypted bytes flowing from main thread
    const stream = fromReadablePort(readablePort);
    // The destination to send encrypted bytes to the main thread
    const writable = fromWritablePort(writablePort);

    // TODO move to main thread
    if (!options || !options.key || !options.iv || !options.authTag) {
      throw new Error('penumbra.decrypt(): missing decryption options');
    }

    // Convert to Uint8Array
    const key = parseBase64OrUint8Array(options.key);
    const iv = parseBase64OrUint8Array(options.iv);
    const authTag = parseBase64OrUint8Array(options.authTag);
    // TODO move above to main thread

    // Start the decryption stream with an event emitter
    const decryptionStreamWithEmitter = startDecryptionStreamWithEmitter(
      stream,
      size,
      id,
      key,
      iv,
      authTag,
    );

    await decryptionStreamWithEmitter.pipeTo(writable);
  }

  /**
   * Streaming encryption of ReadableStreams
   * @param options - Options
   * @param id - ID for tracking encryption completion
   * @param size - File size in bytes
   * @param readablePort - Remote Web Stream readable port (for processing unencrypted files)
   * @param writablePort - Remote Web Stream writable port (for emitting encrypted files)
   */
  async encrypt(
    options: PenumbraEncryptionOptions | null,
    id: JobID<number>,
    size: number, // TODO this should just be on the file object
    readablePort: MessagePort,
    writablePort: MessagePort,
  ): Promise<void> {
    // Stream of plaintext bytes flowing from main thread
    const remoteReadableStream = fromReadablePort(readablePort);
    // The destination to send encrypted bytes to the main thread
    const remoteWritableStream = fromWritablePort(writablePort);

    // TODO: move to main thread
    // Encryption constants
    const GENERATED_KEY_RANDOMNESS = 256;
    // Minimum IV randomness set by NIST
    const IV_RANDOMNESS = 12;

    // Generate a key if one is not provided
    if (!options || !options.key) {
      logger.debug(
        `penumbra.encrypt(): no key specified. generating a random ${GENERATED_KEY_RANDOMNESS}-bit key`,
      );
      // eslint-disable-next-line no-param-reassign
      options = {
        ...options,
        key: crypto.getRandomValues(
          new Uint8Array(GENERATED_KEY_RANDOMNESS / 8),
        ),
      };
    }

    // Convert to Uint8Array
    const key = parseBase64OrUint8Array(options.key);
    const iv = (options as PenumbraDecryptionInfo).iv
      ? parseBase64OrUint8Array((options as PenumbraDecryptionInfo).iv)
      : crypto.getRandomValues(new Uint8Array(IV_RANDOMNESS));
    // TODO: move above to main thread

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
