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
import { penumbra } from './index';

/**
 * Make selected object keys defined by K optional in type T
 */
type Optionalize<T, K extends keyof T> = Omit<T, K> & Partial<T>;

/** penumbra.encrypt() encryption options config (buffers or base64-encoded strings) */
export type PenumbraEncryptionOptions = {
  /** Encryption key */
  key: string | Buffer;
};

/** Parameters (buffers or base64-encoded strings) to decrypt content encrypted with penumbra.encrypt() */
export type PenumbraDecryptionInfo = PenumbraEncryptionOptions & {
  /** Initialization vector */
  iv: string | Buffer;
  /** Authentication tag (for AES GCM) */
  authTag: string | Buffer;
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
  stream: ReadableStream | WritableStream | ArrayBuffer;
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
  decryptionOptions?: {
    /** A base64 encoded decryption key */
    key: string | Buffer;
    /** A base64 encoded initialization vector */
    iv: string | Buffer;
    /** A base64 encoded authentication tag (for AES GCM) */
    authTag: string | Buffer;
  };
  /** Relative file path (needed for zipping) */
  path?: string;
};

/**
 * File is optional
 */
export type RemoteResourceWithoutFile = Optionalize<
  RemoteResource,
  'filePrefix'
>;

/** Type of penumbra worker */
export type WorkerKind = 'decrypt' | 'encrypt' | 'zip';

/** Progress event types */
export type ProgressType = WorkerKind;

/**
 * Progress event details
 */
export type ProgressDetails = {
  /** The URL downloading from */
  url: string;
  /** Progress type */
  type: ProgressType;
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
 * Encryption completetion event details
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

/** Compression levels */
export enum Compression {
  /** No compression */
  Store = 0,
  /** Low compression */
  Low = 1,
  /** Medium compression */
  Medium = 2,
  /** High compression */
  High = 3,
}

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

/**
 * Common Penumbra Worker API
 */
export type PenumbraWorkerAPI = {
  /**
   * Initializes Penumbra worker progress event forwarding
   * to the main thread
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup: (eventListener: any) => Promise<void>;
};

/**
 * Penumbra Decryption Worker API
 */
export type PenumbraDecryptionWorkerAPI = PenumbraWorkerAPI & {
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
};

/**
 * Penumbra Encryption Worker API
 */
export type PenumbraEncryptionWorkerAPI = PenumbraWorkerAPI & {
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
    options: PenumbraEncryptionOptions,
    ids: number[],
    sizes: number[],
    readablePorts: MessagePort[],
    writablePorts: MessagePort[],
  ) => Promise<PenumbraDecryptionInfo[]>;
  /**
   * Buffered (non-streaming) encryption of ArrayBuffers
   *
   * @param buffers - The file buffers to encrypt
   * @returns ArrayBuffer[] of the encrypted files
   */
  encryptBuffers: (
    options: PenumbraEncryptionOptions,
    files: PenumbraFile[],
  ) => Promise<ArrayBuffer[]>;
};

/**
 * Penumbra Zip Worker API
 */
export type PenumbraZipWorkerAPI = PenumbraWorkerAPI & {
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
};

/**
 * Worker location URLs. All fields are absolute URLs.
 */
export type WorkerLocation = {
  /** The directory where the workers scripts are available */
  base: URL;
  /** The location of the decryption Worker script */
  decrypt: URL;
  /** The location of the encryption Worker script */
  encrypt: URL;
  /** The location of the zip Worker script */
  zip: URL;
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
