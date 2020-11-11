/* eslint-disable max-lines */

/**
 *
 * ## Penumbra Type Definitions
 * Common type definitions used throughout penumbra functions.
 *
 * @module penumbra/types
 * @see module:penumbra
 */

// local
import penumbra from './API';
import { PenumbraSupportLevel } from './enums';
import { PenumbraError } from './error';
import { PenumbraZipWriter } from './zip';

export { PenumbraZipWriter } from './zip';

/**
 * Make selected object keys defined by K optional in type T
 */
type Optionalize<T, K extends keyof T> = Omit<T, K> & Partial<T>;

/**
 * penumbra.encrypt() encryption options config (buffers or base64-encoded strings)
 */
export type PenumbraEncryptionOptions = {
  /** Encryption key */
  key: string | Buffer;
};

/**
 * Parameters (buffers or base64-encoded strings) to decrypt content encrypted with penumbra.encrypt()
 */
export type PenumbraDecryptionInfo = PenumbraEncryptionOptions & {
  /** Initialization vector */
  iv: string | Buffer;
  /** Authentication tag (for AES GCM) */
  authTag: string | Buffer;
};

/**
 * Buffers only plz
 */
export type PenumbraDecryptionInfoAsBuffer = Omit<
  PenumbraDecryptionInfo,
  'iv'
> & {
  /** Iv is a buffer */
  iv: Buffer;
};

/**
 * A file to download from a remote resource, that is optionally encrypted
 */
export type RemoteResource = {
  /** The URL to fetch the encrypted or unencrypted file from */
  url: string;
  /** The mimetype of the resulting file */
  mimetype?: string;
  /** The name of the underlying file without the extension */
  filePrefix?: string;
  /** If the file is encrypted, these are the required params */
  decryptionOptions?: PenumbraDecryptionInfo;
  /** Relative file path (needed for zipping) */
  path?: string;
  /** Fetch options */
  requestInit?: RequestInit;
  /** Last modified date */
  lastModified?: Date;
  /** Expected file size */
  size?: number;
  /**
   * Disable calling .final() to validate the authTag.
   *
   * This is useful when providing x-penumbra-iv which is used
   * when the iv is not known
   */
  ignoreAuthTag?: boolean;
};

/** Penumbra file composition */
export type PenumbraFile = Omit<RemoteResource, 'url'> & {
  /** Backing stream */
  stream: ReadableStream;
  /** File size (if backed by a ReadableStream) */
  size?: number;
  /** Optional ID for tracking encryption completion */
  id?: number | string;
  /** Last modified date */
  lastModified?: Date;
};

/** Penumbra file that is currently being encrypted */
export type PenumbraFileWithID = PenumbraFile & {
  /** ID for tracking encryption completion */
  id: number;
};

/** penumbra file (internal) */
export type PenumbraEncryptedFile = Omit<PenumbraFileWithID, 'stream'> & {
  /** Encrypted output stream */
  stream: ReadableStream;
};

/** Penumbra event types */
export type PenumbraEventType = 'decrypt' | 'encrypt' | 'zip';

/**
 * Progress event details
 */
export type ProgressDetails = {
  /** The job ID # or URL being downloaded from for decryption */
  id: string | number;
  /** The ID of the worker thread that is processing this job */
  worker?: number | null;
  /** Event type */
  type: PenumbraEventType;
  /** Percentage completed */
  percent: number;
  /** Total bytes read */
  totalBytesRead: number;
  /** Total number of bytes to read */
  contentLength: number;
};

/**
 * The type that is emitted as progress continuesZipWrite
 */
export type ProgressEmit = CustomEvent<ProgressDetails>;

/**
 * Zip progress event details
 */
export type ZipProgressDetails = {
  /** Percentage completed. `null` indicates indetermination */
  percent: number | null;
  /** The number of bytes or items written so far */
  written: number;
  /** The total number of bytes or items to write. `null` indicates indetermination */
  size: number | null;
};

/**
 * The type that is emitted as zip writes progresses
 */
export type ZipProgressEmit = CustomEvent<ZipProgressDetails>;

/**
 * Zip completion event details
 */
export type ZipCompletionDetails = {};

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
export type JobCompletion = {
  /** Worker ID */
  worker?: number | null;
  /** Job ID */
  id: string | number;
  /** Decryption config info */
  decryptionInfo: PenumbraDecryptionInfo;
};

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
export type PenumbraTextOrURI = {
  /** Data type */
  type: 'text' | 'uri';
  /** Data */
  data: string;
  /** MIME type */
  mimetype?: string;
};

/** Penumbra API */
export type PenumbraAPI = typeof penumbra;

/**
 * Penumbra Worker API
 */
export type PenumbraWorkerAPI = {
  /** Worker ID */
  id: number;
  /**
   * Initializes Penumbra worker progress event forwarding
   * to the main thread
   */
  setup: (id: number, eventListener: (event: Event) => void) => Promise<void>;
  /**
   * Fetches a remote files, deciphers them (if encrypted), and returns ReadableStream[]
   *
   * @param writablePorts - The RemoteWritableStream MessagePorts corresponding to each resource
   * @param resources - The remote resources to download
   * @returns A readable stream of the deciphered file
   */
  get: (
    writablePorts: MessagePort[],
    resources: RemoteResource[],
  ) => Promise<ReadableStream[]>;
  /**
   * Fetches remote files, deciphers them (if encrypted), and returns ArrayBuffer[]
   *
   * @param resources - The remote resources to download
   * @returns A readable stream of the deciphered file
   */
  getBuffers: (resources: RemoteResource[]) => Promise<ArrayBuffer[]>;
  /**
   * Streaming encryption of ReadableStreams
   *
   * @param ids - Unique identifier for tracking encryption completion
   * @param sizes - Size of each file to encrypt (in bytes)
   * @param writablePorts - Remote Web Stream writable ports (for emitting encrypted files)
   * @param readablePorts - Remote Web Stream readable ports (for processing unencrypted files)
   * @returns ReadableStream[] of the encrypted files
   */
  encrypt: (
    options: PenumbraEncryptionOptions | null,
    ids: number[],
    sizes: number[],
    readablePorts: MessagePort[],
    writablePorts: MessagePort[],
  ) => Promise<PenumbraDecryptionInfoAsBuffer[]>;
  /**
   * Buffered (non-streaming) encryption of ArrayBuffers
   *
   * @param buffers - The file buffers to encrypt
   * @returns ArrayBuffer[] of the encrypted files
   */
  encryptBuffers: (
    options: PenumbraEncryptionOptions | null,
    files: PenumbraFile[],
  ) => Promise<ArrayBuffer[]>;
  /**
   * Streaming decryption of ReadableStreams
   *
   * @param ids - Unique identifier for tracking decryption completion
   * @param sizes - Size of each file to decrypt (in bytes)
   * @param writablePorts - Remote Web Stream writable ports (for emitting encrypted files)
   * @param readablePorts - Remote Web Stream readable ports (for processing unencrypted files)
   * @returns ReadableStream[] of the decrypted files
   */
  decrypt: (
    options: PenumbraDecryptionInfo,
    ids: number[],
    sizes: number[],
    readablePorts: MessagePort[],
    writablePorts: MessagePort[],
  ) => Promise<void>;
  /**
   * Buffered (non-streaming) encryption of ArrayBuffers
   *
   * @param buffers - The file buffers to encrypt
   * @returns ArrayBuffer[] of the encrypted files
   */
  decryptBuffers: (
    options: PenumbraDecryptionInfo,
    files: PenumbraFile[],
  ) => Promise<ArrayBuffer[]>;
  /**
   * Creates a zip writer for saving PenumbraFiles which keeps
   * their path data in-tact.
   *
   * @returns PenumbraZipWriter
   */
  saveZip: () => PenumbraZipWriter;
  /**
   * Query Penumbra's level of support for the current browser.
   */
  supported: () => PenumbraSupportLevel;
};

/**
 * Worker location URLs. All fields are absolute URLs.
 */
export type WorkerLocation = {
  /** The directory where the workers scripts are available */
  base: URL;
  /** The location of the Penumbra Worker script */
  penumbra: URL;
  /** The location of the StreamSaver ServiceWorker script */
  StreamSaver: URL;
};

/**
 * Worker location options. All options support relative URLs.
 */
export type WorkerLocationOptions = Partial<WorkerLocation>;

/**
 * An individual Penumbra Worker's interfaces
 */
export type PenumbraWorker = {
  /** Worker ID */
  id: number;
  /** PenumbraWorker's Worker interface */
  worker: Worker;
  /** PenumbraWorker's Comlink interface */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comlink: any;
  /** Busy status (currently processing jobs) */
  busy: boolean;
};

/**
 * An individual Penumbra ServiceWorker's interfaces
 */
export type PenumbraServiceWorker = {
  /** PenumbraWorker's Worker interface */
  worker: ServiceWorker;
  /** PenumbraWorker's Comlink interface */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comlink: any;
};

/** The penumbra workers themselves */
export type PenumbraWorkers = {
  /** The decryption Worker */
  decrypt: PenumbraWorker;
  /** The encryption Worker */
  encrypt: PenumbraWorker;
  /** The zip Worker */
  zip: PenumbraWorker;
  /** The StreamSaver ServiceWorker */
  StreamSaver?: PenumbraServiceWorker;
};

/** Worker->main thread progress forwarder */
export type EventForwarder = {
  /** Comlink-proxied main thread progress event transfer handler */
  handler?: (event: Event) => void;
};

/** PenumbraZipWriter constructor options */
export type ZipOptions = Partial<{
  /** Filename to save to (.zip is optional) */
  name?: string;
  /** Total size of archive (if known ahead of time, for 'store' compression level) */
  size?: number;
  /** Files (in-memory & remote) to add to zip archive */
  files: PenumbraFile[];
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
   * Auto-registered `'write-complete'` event listener. This is equivalent to calling
   * `PenumbraZipWriter.addEventListener('complete', onComplete)`
   */
  onComplete?(event: ZipCompletionEmit): void;
}>;
