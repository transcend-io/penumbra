/** Blob cache manager */
export declare type BlobCacheManager = {
    /** Get Blob cache (list of in-use object URLs) */
    get: () => URL[];
    /** Write to Blob cache */
    set: (cache: URL[] | string[]) => void;
    /** Clear Blob cache */
    clear: () => void;
};
/** Get Blob cache (list of in-use object URLs) */
declare const blobCache: BlobCacheManager;
export default blobCache;
//# sourceMappingURL=blobCache.d.ts.map