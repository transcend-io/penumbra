/**
 * Penumbra Worker
 * Fetch and decrypt files in the browser using whatwg streams and web workers.
 * @author Transcend Inc. <https://transcend.io>
 * @license Apache-2.0
 */

import { expose } from 'comlink';
import { fromWritablePort, fromReadablePort } from 'remote-web-streams';
import { init } from '@transcend-io/encrypt-web-streams';

// local
import type { RemoteResource, JobID } from './types.js';
import fetchAndDecrypt from './fetch-and-decrypt.js';
import { onPenumbraEvent, emitError } from './utils/index.js';
import './transferHandlers/penumbra-events.js';
import { startEncryptionStreamWithEmitter } from './encrypt.js';
import { startDecryptionStreamWithEmitter } from './decrypt.js';
import { setWorkerID } from './worker-id.js';
import { logger, LogLevel } from './logger.js';
import type {
  DecryptionJobParameters,
  EncryptionJobParameters,
} from './worker-types.js';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
      localStream.pipeTo(remoteStream).catch((error: unknown) => {
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
   * @param decryptionParameters - Decryption parameters
   * @param readablePort - Remote Web Stream readable port (for processing encrypted files)
   * @param writablePort - Remote Web Stream writable port (for emitting decrypted files)
   */
  decrypt(
    { key, iv, authTag, jobID, contentLength }: DecryptionJobParameters,
    readablePort: MessagePort,
    writablePort: MessagePort,
  ): void {
    try {
      // Stream of encrypted bytes flowing from main thread
      const remoteReadableStream = fromReadablePort(readablePort);
      // The destination to send encrypted bytes to the main thread
      const remoteWritableStream = fromWritablePort(writablePort);

      // Start the decryption stream with an event emitter
      const decryptionStreamWithEmitter = startDecryptionStreamWithEmitter({
        jobID,
        readableStream: remoteReadableStream,
        contentLength,
        key,
        iv,
        authTag,
      });

      /**
       * This is intentionally not awaited because it does not complete until the entire stream has finished.
       * We want the main caller to be able to await the function return any errors during stream setup.
       *
       * It only emits an error, but does not have an impact on control flow.
       * The consumer can handle the event via the streams interface (preferred), or via this event emitter.
       */
      decryptionStreamWithEmitter
        .pipeTo(remoteWritableStream)
        .catch((error: unknown) => {
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
   * @param encryptionParameters - Encryption parameters
   * @param readablePort - Remote Web Stream readable port (for processing unencrypted files)
   * @param writablePort - Remote Web Stream writable port (for emitting encrypted files)
   */
  encrypt(
    { key, iv, jobID, contentLength }: EncryptionJobParameters,
    readablePort: MessagePort,
    writablePort: MessagePort,
  ): void {
    try {
      logger.debug(`worker.encrypt(): called`, jobID);
      // Stream of plaintext bytes flowing from main thread
      const remoteReadableStream = fromReadablePort(readablePort);

      // The destination to send encrypted bytes to the main thread
      const remoteWritableStream = fromWritablePort(writablePort);

      // Start the encryption stream with an event emitter
      const encryptionStreamWithEmitter = startEncryptionStreamWithEmitter({
        jobID,
        readableStream: remoteReadableStream,
        contentLength,
        key,
        iv,
      });

      /**
       * This is intentionally not awaited because it does not complete until the entire stream has finished.
       * We want the main caller to be able to await the function return any errors during stream setup.
       *
       * It only emits an error, but does not have an impact on control flow.
       * The consumer can handle the event via the streams interface (preferred), or via this event emitter.
       */
      encryptionStreamWithEmitter
        .pipeTo(remoteWritableStream)
        .catch((error: unknown) => {
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
   * Update the log level for the worker
   * @param logLevel - The new log level
   */
  updateLogLevel(logLevel: LogLevel): void {
    logger.setLogLevel(logLevel);
  }

  /**
   * Forward events to main thread
   * @param workerID - Worker ID
   * @param handler - handler
   */
  async setup(
    workerID: number,
    logLevel: LogLevel,
    handler: (event: Event) => void,
  ): Promise<void> {
    // Initialize the Wasm from the encrypt-web-streams library
    await init();

    // Give this worker a unique ID
    setWorkerID(workerID);

    // Set up logging
    logger.setLogLevel(logLevel);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- safer to use a `number` in the template type
    logger.setThread(`worker-${workerID}`);

    // Set up the event handler
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
