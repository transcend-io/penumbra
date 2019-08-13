/**
 *
 * ## Penumbra Type Definitions
 * Common type definitions used throughout penumbra functions.
 *
 * @module penumbra/types
 * @see module:penumbra
 */

/**
 * Make selected object keys defined by K optional in type T
 */
type Optionalize<T, K extends keyof T> = Omit<T, K> & Partial<T>;

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

/** Penumbra file composition */
export type PenumbraFile = {
  /** Backing stream */
  stream: ReadableStream | ArrayBuffer;
  /** File mimetype */
  mimetype: string;
  /** Filename (excluding extension) */
  filePrefix: string;
  /** Relative file path (needed for zipping) */
  path: string;
};

/**
 * Progress event details
 */
export type ProgressDetails = {
  /** The URL downloading from */
  url: string;
  /** Progress type */
  type: 'decrypt' | 'zip';
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
export type PenumbraAPI = {
  /** Retrieve and decrypt files */
  get: (...resources: RemoteResource[]) => Promise<PenumbraFile[]>;
  /** Save files retrieved by Penumbra */
  save: (data: PenumbraFile[], fileName?: string) => Promise<void>;
  /** Load files retrieved by Penumbra into memory as a Blob */
  getBlob: (
    data: PenumbraFile[] | PenumbraFile | ReadableStream,
  ) => Promise<Blob>;
  /** Get file text (if content is viewable) or URI (if content is not viewable) */
  getTextOrURI: (
    data: PenumbraFile[] | PenumbraFile,
  ) => Promise<PenumbraTextOrURI[] | PenumbraTextOrURI>;
  /** Zip files retrieved by Penumbra */
  zip: (
    data: PenumbraFile[] | PenumbraFile,
    compressionLevel?: number,
  ) => Promise<ReadableStream>;
  /** Configure location of worker threads */
  setWorkerLocation: (options: WorkerLocationOptions | string) => Promise<void>;
};

/** Penumbra API as exposed on the current DOM AbstractView */
export type PenumbraView = Window & {
  /** Root API property */
  penumbra?: PenumbraAPI;
};

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
  getBuffer: (resources: RemoteResource[]) => Promise<ArrayBuffer[]>;
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
 * Worker location options. All options support relative URLs.
 */
export type WorkerLocationOptions = {
  /** The directory where the workers scripts are available */
  base?: string;
  /** The location of the decryption Worker script */
  decrypt?: string;
  /** The location of the zip Worker script */
  zip?: string;
  /** The location of the StreamSaver ServiceWorker script */
  StreamSaver?: string;
};

/**
 * Worker location URLs. All fields are absolute URLs.
 */
export type WorkerLocation = {
  /** The directory where the workers scripts are available */
  base: URL;
  /** The location of the decryption Worker script */
  decrypt: URL;
  /** The location of the zip Worker script */
  zip: URL;
  /** The location of the StreamSaver ServiceWorker script */
  StreamSaver: URL;
};

/**
 * An individual Penumbra Worker's interfaces
 */
export type PenumbraWorker = {
  /** PenumbraWorker's Worker interface */
  worker: Worker;
  /** PenumbraWorker's Comlink interface */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comlink: any;
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
  /** The zip Worker */
  zip: PenumbraWorker;
  /** The StreamSaver ServiceWorker */
  StreamSaver?: PenumbraServiceWorker;
};

/** Worker->main thread progress forwarder */
export type ProgressForwarder = {
  /** Comlink-proxied main thread progress event transfer handler */
  handler?: (event: ProgressEmit) => Promise<void>;
};
