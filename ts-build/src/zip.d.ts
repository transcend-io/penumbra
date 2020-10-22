import { PenumbraFile } from './types';
/** PenumbraZipWriter constructor options */
export declare type ZipOptions = Partial<{
    /** Filename to save to (.zip is optional) */
    name: string;
    /** Total size of archive (if known ahead of time, for 'store' compression level) */
    size: number;
    /** PenumbraFile[] to add to zip archive */
    files: PenumbraFile[];
    /** Abort controller for cancelling zip generation and saving */
    controller: AbortController;
    /** Zip archive compression level */
    compressionLevel: number;
    /** Store a copy of the resultant zip file in-memory for debug & testing */
    debug: boolean;
}>;
/** Compression levels */
export declare enum Compression {
    /** No compression */
    Store = 0,
    /** Low compression */
    Low = 1,
    /** Medium compression */
    Medium = 2,
    /** High compression */
    High = 3
}
/** Wrapped WritableStream for state keeping with StreamSaver */
export declare class PenumbraZipWriter {
    /** Conflux zip writer instance */
    private conflux;
    /** Conflux WritableStream interface */
    private writer;
    /** Save completion state */
    private closed;
    /** Debug mode */
    private debug;
    /** Debug zip buffer used for testing */
    private debugZipBuffer;
    /** Pending unfinished write() calls */
    private pendingWrites;
    /** Abort controller */
    private controller;
    /**
     * Penumbra zip writer constructor
     *
     * @param options - ZipOptions
     * @returns PenumbraZipWriter class instance
     */
    constructor(options?: ZipOptions);
    /**
     * Add decrypted PenumbraFiles to zip
     *
     * @param files - Decrypted PenumbraFile[] to add to zip
     */
    write(...files: PenumbraFile[]): Promise<PromiseSettledResult<void>[]>;
    /** Enqueue closing of the Penumbra zip writer (after pending writes finish) */
    close(): Promise<PromiseSettledResult<void>[]>;
    /** Cancel Penumbra zip writer */
    abort(): void;
    /** Get buffered output (requires debug mode) */
    getBuffer(): Promise<ArrayBuffer>;
}
/**
 * Zip files retrieved by Penumbra
 *
 * @param options - ZipOptions
 * @returns PenumbraZipWriter class instance
 */
export declare function saveZip(options?: ZipOptions): PenumbraZipWriter;
//# sourceMappingURL=zip.d.ts.map