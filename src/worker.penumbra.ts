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
import emitError from './utils/emitError';
import { PenumbraError } from './error';

if (self.document) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Handle an error
 * @param error - The error
 * @param id - The job ID
 */
function handleErrorViaEmit(error: unknown, id: JobID<string | number>): void {
  if (error instanceof PenumbraError) {
    emitError(error);
    throw error;
  }
  emitError(
    new PenumbraError(
      error instanceof Error ? error : new Error(String(error)),
      id,
    ),
  );
}

/**
 * Penumbra Worker class
 */
class PenumbraWorker {
  /**
   * Fetches remote files from URLs, deciphers them (if encrypted), and returns ReadableStream[]
   * @param writablePort - Remote Web Stream writable port
   * @param resource - The remote resource to download
   */
  async get(
    writablePort: MessagePort,
    resource: RemoteResource,
  ): Promise<void> {
    try {
      // TODO: move to main thread
      if (!('url' in resource)) {
        throw new Error(
          'PenumbraDecryptionWorker.get(): RemoteResource missing URL',
        );
      }

      const remoteStream = fromWritablePort(writablePort);
      const localStream = await fetchAndDecrypt(resource);

      // TODO: figure out if we can await this
      localStream.pipeTo(remoteStream).catch((error) => {
        handleErrorViaEmit(error, resource.url); // TODO: switch to JobID?
      });
    } catch (error: unknown) {
      handleErrorViaEmit(error, resource.url); // TODO: switch to JobID?
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

    // TODO: make consistent with get() - probably should not await this, wrap everything else in try/catch and await in main for completion of above
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
