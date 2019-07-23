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
};

/**
 * File is optional
 */
export type RemoteResourceWithoutFile = Optionalize<
  RemoteResource,
  'filePrefix'
>;

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

/** File returned by penumbra.get() */
export type PenumbraFile = File | ReadableStream;

/** Files returned by penumbra.get() */
export type PenumbraFiles = PenumbraFile[] | ReadableStream;

/** Penumbra API */
export type PenumbraAPI = {
  /** Retrieve and decrypt files */
  get: (...resources: RemoteResourceWithoutFile[]) => Promise<PenumbraFiles>;
  /** Save files retrieved by Penumbra */
  save: (data: PenumbraFiles, fileName?: string) => Promise<void>;
  /** Load files retrieved by Penumbra into memory as a Blob */
  getBlob: (data: PenumbraFiles) => Promise<Blob>;
  /** Get file text (if content is viewable) or URI (if content is not viewable) */
  getTextOrURI: (
    data: PenumbraFiles,
  ) => Promise<{
    /** Type of response data */
    type: 'text' | 'uri';
    /** The response data */
    data: string;
  }>;
  /** Zip files retrieved by Penumbra */
  zip: (
    data: PenumbraFiles,
    compressionLevel?: number,
  ) => Promise<ReadableStream>;
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
  fetchMany: (...resources: RemoteResourceWithoutFile[]) => string;
};
