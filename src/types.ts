// local
import type { Remote } from 'comlink';
import type { PenumbraWorker as PenumbraWorkerAPI } from './worker.penumbra';
import type { PenumbraError } from './error';

import type { JobID } from './job-id';
import type { Compression } from './enums';

export { PenumbraZipWriter } from './zip';

/**
 * penumbra.encrypt() encryption options config (buffers or base64-encoded strings)
 */
export interface PenumbraEncryptionOptions {
  /** Encryption key, either Uint8Array or base64-encoded string */
  key: Uint8Array | string;
  /** Initialization vector, either Uint8Array or base64-encoded string */
  iv: Uint8Array | string;
}

/**
 * Parameters (buffers or base64-encoded strings) to decrypt content encrypted with penumbra.encrypt()
 */
export interface PenumbraDecryptionOptions extends PenumbraEncryptionOptions {
  /** Authentication tag (for AES GCM), either Uint8Array or base64-encoded string */
  authTag: Uint8Array | string;
}

/**
 * Result of completion of decryption and encryption jobs
 */
export interface PenumbraDecryptionInfo {
  /** Encryption key */
  key: Uint8Array;
  /** Initialization vector */
  iv: Uint8Array;
  /** Authentication tag (for AES GCM) */
  authTag: Uint8Array;
}

/** The base resource from which RemoteResource and PenumbraFile extend */
interface Resource {
  /** The name of the underlying file without the extension */
  filePrefix?: string | undefined;
  /** Last modified date */
  lastModified?: Date | undefined;
  /** Relative file path (needed for zipping) */
  path?: string | undefined;
  /** The mimetype of the resulting file */
  mimetype?: string | undefined;
  /** File size (if backed by a ReadableStream) */
  size?: number | undefined;
}

/** A file to download from a remote resource, that is optionally encrypted */
export interface RemoteResource extends Partial<Resource> {
  /** The URL to fetch the encrypted or unencrypted file from */
  url: string;
  /** Fetch options */
  requestInit?: RequestInit | undefined;
  /** If the file is encrypted, these are the required params */
  decryptionOptions?: PenumbraDecryptionOptions | undefined;
  /**
   * Dangerously bypass authTag validation. Only use this for testing purposes.
   * @default false
   */
  ignoreAuthTag?: boolean | undefined;
}

/** Penumbra file composition */
export interface PenumbraFile extends Partial<Resource> {
  /** Backing stream */
  stream: ReadableStream<Uint8Array>;
}

/** Penumbra file that is currently being encrypted */
export interface PenumbraFileWithID extends PenumbraFile {
  /** ID for tracking encryption completion */
  id: JobID;
}

/** Penumbra event types */
export type PenumbraEventType = 'decrypt' | 'encrypt';

/**
 * Progress event details
 */
export interface ProgressDetails {
  /** The job ID # or URL being downloaded from for decryption */
  id: JobID;
  /** The ID of the worker thread that is processing this job */
  worker?: number | null;
  /** Event type */
  type: PenumbraEventType;
  /** Percentage completed */
  percent: number | null;
  /** Total bytes read */
  totalBytesRead: number;
  /** Total number of bytes to read */
  contentLength: number | null;
}

/**
 * The type that is emitted as progress continues
 */
export type ProgressEmit = CustomEvent<ProgressDetails>;

/**
 * Zip progress event details
 */
export interface ZipProgressDetails {
  /** Percentage completed. `null` indicates indetermination */
  percent: number | null;
  /** The number of bytes or items written so far */
  written: number;
  /** The total number of bytes or items to write. `null` indicates indetermination */
  size: number | null;
}

/**
 * The type that is emitted as zip writes progresses
 */
export type ZipProgressEmit = CustomEvent<ZipProgressDetails>;

/**
 * Zip completion event details
 */
export type ZipCompletionDetails = unknown;

/**
 * The type that is emitted as when zip is finished
 */
export type ZipCompletionEmit = CustomEvent<ZipCompletionDetails>;

/**
 * Penumbra error event details
 */
export type PenumbraErrorDetails = PenumbraError;

/** Penumbra error event */
export type PenumbraErrorEmit = CustomEvent<PenumbraErrorDetails>;

/**
 * Encryption/decryption job completion event details
 */
export interface JobCompletion {
  /** Worker ID */
  worker?: number | null;
  /** Job ID */
  id: JobID;
  /** Decryption config info */
  decryptionInfo: PenumbraDecryptionInfo;
}

/**
 * The type that is emitted when a job is complete
 */
export type JobCompletionEmit = CustomEvent<JobCompletion>;

/** Data returned by penumbra.getTextOrURI() */
export interface PenumbraTextOrURI {
  /** Data type */
  type: 'text' | 'uri';
  /** Data */
  data: string;
  /** MIME type */
  mimetype?: string;
}

/** Penumbra API */

/**
 * Penumbra Worker API
 */

/**
 * A remote with a type of PenumbraWorkerAPI
 */
export type PenumbraWorkerComlinkInterface = Remote<
  new () => PenumbraWorkerAPI
>;

/**
 * An individual Penumbra Worker's interfaces
 */
export interface PenumbraWorker {
  /** Worker ID */
  id: number;
  /** PenumbraWorker's Worker interface */
  worker: Worker;
  /** PenumbraWorker's Comlink interface */
  comlink: PenumbraWorkerComlinkInterface; // TODO: rename to RemoteAPI - this is a class
  /** Busy status (currently processing jobs) */
  busy: boolean;
}

/**
 * An individual Penumbra ServiceWorker's interfaces
 */
export interface PenumbraServiceWorker {
  /** PenumbraWorker's Worker interface */
  worker: ServiceWorker;
  /** PenumbraWorker's Comlink interface */
  comlink: PenumbraWorkerComlinkInterface; // TODO: rename to RemoteAPI - this is a class
}

/** The penumbra workers themselves */
export interface PenumbraWorkers {
  /** The decryption Worker */
  decrypt: PenumbraWorker;
  /** The encryption Worker */
  encrypt: PenumbraWorker;
  /** The zip Worker */
  zip: PenumbraWorker;
  /** The StreamSaver ServiceWorker */
  StreamSaver?: PenumbraServiceWorker;
}

/** Worker->main thread progress forwarder */
export interface EventForwarder {
  /** Comlink-proxied main thread progress event transfer handler */
  handler?: (event: Event) => void;
}

/** PenumbraZipWriter constructor options */
export type ZipOptions = Partial<{
  /** Filename to save to (.zip is optional) */
  name?: string | undefined;
  /** Total size of archive (if known ahead of time, for 'store' compression level) */
  size?: number | undefined;
  /** Abort controller for cancelling zip generation and saving */
  controller: AbortController;
  /** Allow & auto-rename duplicate files sent to writer. Defaults to on */
  allowDuplicates: boolean;
  /** Zip archive compression level */
  compressionLevel: Compression;
  /** Store a copy of the resultant zip file in-memory for inspection & testing */
  saveBuffer: boolean;
  /**
   * Auto-registered `'progress'` event listener. This is equivalent to calling
   * `PenumbraZipWriter.addEventListener('progress', onProgress)`
   */
  onProgress?(event: ZipProgressEmit): void;
  /**
   * Auto-registered `'complete'` event listener. This is equivalent to calling
   * `PenumbraZipWriter.addEventListener('complete', onComplete)`
   */
  onComplete?(event: ZipCompletionEmit): void;
}>;

export { type JobID } from './job-id';
export { type Penumbra as PenumbraAPI } from './api';
export { type PenumbraWorker as PenumbraWorkerAPI } from './worker.penumbra';
