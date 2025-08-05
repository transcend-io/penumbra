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
import { onPenumbraEvent, emitError } from './utils';
import './transferHandlers/penumbra-events';
import { startEncryptionStreamWithEmitter } from './encrypt';
import { startDecryptionStreamWithEmitter } from './decrypt';
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
   * @param writablePort - Remote Web Stream writable port
   * @param resource - The remote resource to download
   * @param jobID - Job ID for tracking job completion
   */
  async get(
    writablePort: MessagePort,
    resource: RemoteResource,
    jobID: JobID,
  ): Promise<void> {
    try {
      const remoteStream = fromWritablePort(writablePort);
      const localStream = await fetchAndDecrypt(jobID, resource);

      /**
       * This is intentionally not awaited because it does not complete until the entire stream has finished.
       * We want the main caller to be able to await the function return any errors during stream setup.
       *
       * It only emits an error, but does not have an impact on control flow.
       * The consumer can handle the event via the streams interface (preferred), or via this event emitter.
       */
      localStream.pipeTo(remoteStream).catch((error) => {
        emitError(error, jobID);
      });
    } catch (error: unknown) {
      /**
       * For any errors that happened in the control flow (i.e., not a stream error), throw out to the main thread caller to catch.
       */
      emitError(error, jobID);
      throw error;
    }
  }

  /**
   * Streaming decryption of ReadableStreams
   * @param key - Decryption key
   * @param iv - Decryption IV
   * @param authTag - Decryption authTag
   * @param jobID - Job ID for tracking decryption completion
   * @param size - File size in bytes
   * @param readablePort - Remote Web Stream readable port (for processing encrypted files)
   * @param writablePort - Remote Web Stream writable port (for emitting decrypted files)
   */
  decrypt(
    key: Uint8Array,
    iv: Uint8Array,
    authTag: Uint8Array,
    jobID: JobID,
    size: number | null,
    readablePort: MessagePort,
    writablePort: MessagePort,
  ): void {
    try {
      // Stream of encrypted bytes flowing from main thread
      const remoteReadableStream = fromReadablePort(readablePort);
      // The destination to send encrypted bytes to the main thread
      const remoteWritableStream = fromWritablePort(writablePort);

      // Start the decryption stream with an event emitter
      const decryptionStreamWithEmitter = startDecryptionStreamWithEmitter(
        jobID,
        remoteReadableStream,
        size,
        key,
        iv,
        authTag,
      );

      /**
       * This is intentionally not awaited because it does not complete until the entire stream has finished.
       * We want the main caller to be able to await the function return any errors during stream setup.
       *
       * It only emits an error, but does not have an impact on control flow.
       * The consumer can handle the event via the streams interface (preferred), or via this event emitter.
       */
      decryptionStreamWithEmitter
        .pipeTo(remoteWritableStream)
        .catch((error) => {
          emitError(error, jobID);
        });
    } catch (error) {
      /**
       * For any errors that happened in the control flow (i.e., not a stream error), throw out to the main thread caller to catch.
       */
      emitError(error, jobID);
      throw error;
    }
  }

  /**
   * Streaming encryption of ReadableStreams
   * @param key - Encryption key
   * @param iv - Encryption IV
   * @param jobID - ID for tracking encryption completion
   * @param size - File size in bytes
   * @param readablePort - Remote Web Stream readable port (for processing unencrypted files)
   * @param writablePort - Remote Web Stream writable port (for emitting encrypted files)
   */
  encrypt(
    key: Uint8Array,
    iv: Uint8Array,
    jobID: JobID,
    size: number | null,
    readablePort: MessagePort,
    writablePort: MessagePort,
  ): void {
    try {
      // Stream of plaintext bytes flowing from main thread
      const remoteReadableStream = fromReadablePort(readablePort);

      // The destination to send encrypted bytes to the main thread
      const remoteWritableStream = fromWritablePort(writablePort);

      // Start the encryption stream with an event emitter
      const encryptionStreamWithEmitter = startEncryptionStreamWithEmitter(
        jobID,
        remoteReadableStream,
        size,
        key,
        iv,
      );

      /**
       * This is intentionally not awaited because it does not complete until the entire stream has finished.
       * We want the main caller to be able to await the function return any errors during stream setup.
       *
       * It only emits an error, but does not have an impact on control flow.
       * The consumer can handle the event via the streams interface (preferred), or via this event emitter.
       */
      encryptionStreamWithEmitter
        .pipeTo(remoteWritableStream)
        .catch((error) => {
          emitError(error, jobID);
        });
    } catch (error) {
      /**
       * For any errors that happened in the control flow (i.e., not a stream error), throw out to the main thread caller to catch.
       */
      emitError(error, jobID);
      throw error;
    }
  }

  /**
   * Forward events to main thread
   * @param workerID - Worker ID
   * @param handler - handler
   */
  async setup(
    workerID: number,
    handler: (event: Event) => void,
  ): Promise<void> {
    // Initialize the Wasm from the encrypt-web-streams library
    await init();
    setWorkerID(workerID);
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
