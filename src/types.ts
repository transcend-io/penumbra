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
import { PenumbraError } from './error';

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

/** Penumbra file composition */
export type PenumbraFile = {
  /** Backing stream */
  stream: ReadableStream | ArrayBuffer;
  /** File size (if backed by a ReadableStream) */
  size?: number;
  /** File mimetype */
  mimetype: string;
  /** Filename (excluding extension) */
  filePrefix: string;
  /** Relative file path (needed for zipping) */
  path: string;
  /** Optional ID for tracking encryption completion */
  id?: number;
};

/** Penumbra file that is currently being encrypted */
export type PenumbraFileWithID = PenumbraFile & {
  /** ID for tracking encryption completion */
  id: number;
};

/** penumbra.encrypt() output file (internal) */
export type PenumbraEncryptedFile = Omit<PenumbraFileWithID, 'stream'> & {
  /** Encrypted output stream */
  stream: ReadableStream | ArrayBuffer;
};

/**
 * A file to download from a remote resource, that is optionally encrypted
 */
export type RemoteResource = {
  /** The URL to fetch the encrypted or unencrypted file from */
  url: string;
  /** The mimetype of the resulting file */
  mimetype: string;
  /** The name of the underlying file without the extension */
  filePrefix: string;
  /** If the file is encrypted, these are the required params */
  decryptionOptions?: PenumbraDecryptionInfo;
  /** Relative file path (needed for zipping) */
  path?: string;
  /** Fetch options */
  requestInit?: RequestInit;
};

/**
 * Remote resource where file prefix is optional
 */
export type RemoteResourceWithoutFile = Optionalize<
  RemoteResource,
  'filePrefix'
>;

/** Penumbra event types */
export type PenumbraEventType = 'decrypt' | 'encrypt' | 'zip';

/**
 * Progress event details
 */
export type ProgressDetails = {
  /** The job ID # or URL being downloaded from for decryption */
  id: string | number;
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
 * The type that is emitted as progress continues
 */
export type ProgressEmit = CustomEvent<ProgressDetails>;

/**
 * Penumbra error event details
 */
export type PenumbraErrorDetails = PenumbraError;

/** Penumbra error event */
export type PenumbraErrorEmit = CustomEvent<PenumbraErrorDetails>;

/**
 * Encryption completion event details
 */
export type EncryptionCompletion = {
  /** Encryption job ID */
  id: number;
  /** Decryption config info */
  decryptionInfo: PenumbraDecryptionInfo;
};

/**
 * The type that is emitted as progress continues
 */
export type EncryptionCompletionEmit = CustomEvent<EncryptionCompletion>;

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
  mimetype: string;
};

/** Penumbra API */
export type PenumbraAPI = typeof penumbra;

/** Penumbra user agent support level */
export enum PenumbraSupportLevel {
  /** Old browser where Penumbra will not work at all */
  none = -1,
  /** Modern browser where Penumbra is not yet supported */
  possible = 0,
  /** Modern browser where file size limit is low */
  size_limited = 1,
  /** Modern browser with full support */
  full = 2,
}

/**
 * Penumbra Worker API
 */
export type PenumbraWorkerAPI = {
  /**
   * Initializes Penumbra worker progress event forwarding
   * to the main thread
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup: (eventListener: any) => Promise<void>;
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
   * Zips one or more PenumbraFiles while keeping their path
   * data in-tact.
   *
   * @param writablePort - Remote Web Stream writable ports
   * @param files - PenumbraFiles to zip
   * @returns A readable stream of zip file
   */
  zip: (
    writablePort: MessagePort,
    files: PenumbraFile[],
  ) => Promise<ReadableStream>;
  /**
   * Query Penumbra's level of support for the current browser.
   *
   * -0 - Old browser where penumbra does not work at all.
   *  0 - Modern browser where penumbra is not yet supported.
   *  1 - Modern browser where file size limit is low.
   *  2 - Modern browser with full support.
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
  /** PenumbraWorker's Worker interface */
  worker: Worker;
  /** PenumbraWorker's Comlink interface */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comlink: any;
  /** Worker initialization state */
  initialized: boolean;
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
  handler?: (event: Event) => Promise<void>;
};
