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
  /** The name of the custom event emitted, default (TODO) is the URL fetching from */
  progressEventName?: string;
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
  stream: ReadableStream;
  /** File mimetype */
  mimetype: string;
  /** Filename (excluding extension) */
  filePrefix: string;
  /** Relative file path (needed for zipping) */
  path: string;
};

/**
 * The type that is emitted as progress continues
 */
export type ProgressEmit = CustomEvent<{
  /** Percentage completed */
  percent: number;
  /** Total bytes read */
  totalBytesRead: number;
  /** Total number of bytes to read */
  contentLength: number;
  /** The URL downloading from */
  url: string;
}>;

/** Compression levels */
export enum compression {
  /** No compression */
  store = 0,
  /** Low compression */
  low = 1,
  /** Medium compression */
  medium = 2,
  /** High compression */
  high = 3,
}

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
    data: PenumbraFile[],
    mimetype?: string,
  ) => Promise<{
    /** Type of response data */
    type: 'text' | 'uri';
    /** The response data */
    data: string;
  }>;
  /** Zip files retrieved by Penumbra */
  zip: (
    data: PenumbraFile[],
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
 * Penumbra Decryption Worker API
 */
export type PenumbraDecryptionWorkerAPI = {
  /**
   * Fetches a remote file from a URL, deciphers it (if encrypted), and returns a ReadableStream
   *
   * @param resource - The remote resource to download
   * @returns A readable stream of the deciphered file
   */
  get: (
    writablePorts: MessagePort[],
    resources: RemoteResource[],
  ) => Promise<ReadableStream[]>;
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
  comlink: any;
};

/**
 * An individual Penumbra ServiceWorker's interfaces
 */
export type PenumbraServiceWorker = {
  /** PenumbraWorker's Worker interface */
  worker: ServiceWorker;
  /** PenumbraWorker's Comlink interface */
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
