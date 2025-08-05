// local
import type { Remote } from 'comlink';
import type { Penumbra as PenumbraAPI } from './API';
import type { PenumbraWorker as PenumbraWorkerAPI } from './worker.penumbra';
import type { PenumbraError } from './error';

import type { JobID } from './job-id';

export { PenumbraZipWriter } from './zip';
export type { JobID };

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

interface Resource {
  /** The mimetype of the resulting file */
  mimetype?: string;
  /** The name of the underlying file without the extension */
  filePrefix?: string;
  /** If the file is encrypted, these are the required params */
  decryptionOptions?: PenumbraDecryptionOptions;
  /** Relative file path (needed for zipping) */
  path?: string;
  /** Last modified date */
  lastModified?: Date;
  /** Expected file size */
  size?: number;
  /**
   * Dangerously bypass authTag validation. Only use this for testing purposes.
   * @default false
   */
  ignoreAuthTag?: boolean;
}

/**
 * A file to download from a remote resource, that is optionally encrypted
 */
export interface RemoteResource extends Resource {
  /** The URL to fetch the encrypted or unencrypted file from */
  url: string;
  /** Fetch options */
  requestInit?: RequestInit;
}

/** Penumbra file composition */
export interface PenumbraFile extends Resource {
  /** Backing stream */
  stream: ReadableStream;
  /** File size (if backed by a ReadableStream) */
  size?: number;
  /** Last modified date */
  lastModified?: Date;
}

/** Penumbra file that is currently being encrypted */
export interface PenumbraFileWithID extends PenumbraFile {
  /** ID for tracking encryption completion */
  id: JobID;
}

/** Penumbra event types */
export type PenumbraEventType = 'decrypt' | 'encrypt' | 'zip';

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
 * The type that is emitted as progress continuesZipWrite
 */
export interface ProgressEmit extends CustomEvent<ProgressDetails> {}

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
export interface ZipProgressEmit extends CustomEvent<ZipProgressDetails> {}

/**
 * Zip completion event details
 */
export type ZipCompletionDetails = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The type that is emitted as progress continues
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
  decryptionInfo: PenumbraDecryptionOptions;
}

/**
 * The type that is emitted as progress continues
 */
export type JobCompletionEmit = CustomEvent<JobCompletion>;

/**
 * The type that is emitted when penumbra is ready
 * to be used
 */
export type PenumbraReady = CustomEvent<{
  /** Penumbra API object */
  penumbra: PenumbraAPI;
}>;

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
export type { PenumbraAPI };

/**
 * Penumbra Worker API
 */
export type { PenumbraWorkerAPI };

/**
 * Worker location URLs. All fields are absolute URLs.
 */
export interface WorkerLocation {
  /** The directory where the workers scripts are available */
  base: URL;
  /** The location of the Penumbra Worker script */
  penumbra: URL;
  /** The location of the StreamSaver ServiceWorker script - TODO: is this in use? */
  StreamSaver: URL;
}

/**
 * Worker location options. All options support relative URLs.
 */
export interface WorkerLocationOptions extends Partial<WorkerLocation> {}

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
export interface ZipOptions
  extends Partial<{
    /** Filename to save to (.zip is optional) */
    name?: string;
    /** Total size of archive (if known ahead of time, for 'store' compression level) */
    size?: number;
    /** Abort controller for cancelling zip generation and saving */
    controller: AbortController;
    /** Allow & auto-rename duplicate files sent to writer. Defaults to on */
    allowDuplicates: boolean;
    /** Zip archive compression level */
    compressionLevel: number;
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
  }> {}
