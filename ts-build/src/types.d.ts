/// <reference types="node" />
/**
 *
 * ## Penumbra Type Definitions
 * Common type definitions used throughout penumbra functions.
 *
 * @module penumbra/types
 * @see module:penumbra
 */
import penumbra from './API';
import { PenumbraError } from './error';
import { PenumbraZipWriter } from './zip';
export { PenumbraZipWriter } from './zip';
/** Penumbra user agent support level */
export declare enum PenumbraSupportLevel {
    /** Old browser where Penumbra does not work at all */
    none = 0,
    /** Modern browser where Penumbra is not yet supported */
    possible = 0,
    /** Modern browser where file size limit is low */
    size_limited = 1,
    /** Modern browser with full support */
    full = 2
}
/**
 * penumbra.encrypt() encryption options config (buffers or base64-encoded strings)
 */
export declare type PenumbraEncryptionOptions = {
    /** Encryption key */
    key: string | Buffer;
};
/**
 * Parameters (buffers or base64-encoded strings) to decrypt content encrypted with penumbra.encrypt()
 */
export declare type PenumbraDecryptionInfo = PenumbraEncryptionOptions & {
    /** Initialization vector */
    iv: string | Buffer;
    /** Authentication tag (for AES GCM) */
    authTag: string | Buffer;
};
/**
 * Buffers only plz
 */
export declare type PenumbraDecryptionInfoAsBuffer = Omit<PenumbraDecryptionInfo, 'iv'> & {
    /** Iv is a buffer */
    iv: Buffer;
};
/**
 * A file to download from a remote resource, that is optionally encrypted
 */
export declare type RemoteResource = {
    /** The URL to fetch the encrypted or unencrypted file from */
    url: string;
    /** The mimetype of the resulting file */
    mimetype: string;
    /** The name of the underlying file without the extension */
    filePrefix?: string;
    /** If the file is encrypted, these are the required params */
    decryptionOptions?: PenumbraDecryptionInfo;
    /** Relative file path (needed for zipping) */
    path?: string;
    /** Fetch options */
    requestInit?: RequestInit;
};
/** Penumbra file composition */
export declare type PenumbraFile = Omit<RemoteResource, 'url'> & {
    /** Backing stream */
    stream: ReadableStream | ArrayBuffer;
    /** File size (if backed by a ReadableStream) */
    size?: number;
    /** Optional ID for tracking encryption completion */
    id?: number | string;
    /** Last modified date */
    lastModified?: Date;
};
/** Penumbra file that is currently being encrypted */
export declare type PenumbraFileWithID = PenumbraFile & {
    /** ID for tracking encryption completion */
    id: number;
};
/** penumbra file (internal) */
export declare type PenumbraEncryptedFile = Omit<PenumbraFileWithID, 'stream'> & {
    /** Encrypted output stream */
    stream: ReadableStream | ArrayBuffer;
};
/** Penumbra event types */
export declare type PenumbraEventType = 'decrypt' | 'encrypt' | 'zip';
/**
 * Progress event details
 */
export declare type ProgressDetails = {
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
 * The type that is emitted as progress continues
 */
export declare type ProgressEmit = CustomEvent<ProgressDetails>;
/**
 * Penumbra error event details
 */
export declare type PenumbraErrorDetails = PenumbraError;
/** Penumbra error event */
export declare type PenumbraErrorEmit = CustomEvent<PenumbraErrorDetails>;
/**
 * Encryption/decryption job completion event details
 */
export declare type JobCompletion = {
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
export declare type JobCompletionEmit = CustomEvent<JobCompletion>;
/**
 * The type that is emitted when penumbra is ready
 * to be used
 */
export declare type PenumbraReady = CustomEvent<{
    /** Penumbra API object */
    penumbra: PenumbraAPI;
}>;
/** Data returned by penumbra.getTextOrURI() */
export declare type PenumbraTextOrURI = {
    /** Data type */
    type: 'text' | 'uri';
    /** Data */
    data: string;
    /** MIME type */
    mimetype: string;
};
/** Penumbra API */
export declare type PenumbraAPI = typeof penumbra;
/**
 * Penumbra Worker API
 */
export declare type PenumbraWorkerAPI = {
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
    get: (writablePorts: MessagePort[], resources: RemoteResource[]) => Promise<ReadableStream[]>;
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
    encrypt: (options: PenumbraEncryptionOptions | null, ids: number[], sizes: number[], readablePorts: MessagePort[], writablePorts: MessagePort[]) => Promise<PenumbraDecryptionInfoAsBuffer[]>;
    /**
     * Buffered (non-streaming) encryption of ArrayBuffers
     *
     * @param buffers - The file buffers to encrypt
     * @returns ArrayBuffer[] of the encrypted files
     */
    encryptBuffers: (options: PenumbraEncryptionOptions | null, files: PenumbraFile[]) => Promise<ArrayBuffer[]>;
    /**
     * Streaming decryption of ReadableStreams
     *
     * @param ids - Unique identifier for tracking decryption completion
     * @param sizes - Size of each file to decrypt (in bytes)
     * @param writablePorts - Remote Web Stream writable ports (for emitting encrypted files)
     * @param readablePorts - Remote Web Stream readable ports (for processing unencrypted files)
     * @returns ReadableStream[] of the decrypted files
     */
    decrypt: (options: PenumbraDecryptionInfo, ids: number[], sizes: number[], readablePorts: MessagePort[], writablePorts: MessagePort[]) => Promise<void>;
    /**
     * Buffered (non-streaming) encryption of ArrayBuffers
     *
     * @param buffers - The file buffers to encrypt
     * @returns ArrayBuffer[] of the encrypted files
     */
    decryptBuffers: (options: PenumbraDecryptionInfo, files: PenumbraFile[]) => Promise<ArrayBuffer[]>;
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
export declare type WorkerLocation = {
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
export declare type WorkerLocationOptions = Partial<WorkerLocation>;
/**
 * An individual Penumbra Worker's interfaces
 */
export declare type PenumbraWorker = {
    /** Worker ID */
    id: number;
    /** PenumbraWorker's Worker interface */
    worker: Worker;
    /** PenumbraWorker's Comlink interface */
    comlink: any;
    /** Busy status (currently processing jobs) */
    busy: boolean;
};
/**
 * An individual Penumbra ServiceWorker's interfaces
 */
export declare type PenumbraServiceWorker = {
    /** PenumbraWorker's Worker interface */
    worker: ServiceWorker;
    /** PenumbraWorker's Comlink interface */
    comlink: any;
};
/** The penumbra workers themselves */
export declare type PenumbraWorkers = {
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
export declare type EventForwarder = {
    /** Comlink-proxied main thread progress event transfer handler */
    handler?: (event: Event) => void;
};
//# sourceMappingURL=types.d.ts.map