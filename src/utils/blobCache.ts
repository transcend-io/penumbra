/** Blob cache manager */
export type BlobCacheManager = {
  /** Get Blob cache (list of in-use object URLs) */
  get: () => URL[];
  /** Write to Blob cache */
  set: (cache: URL[] | string[]) => void;
  /** Clear Blob cache */
  clear: () => void;
};

/** Get Blob cache (list of in-use object URLs) */
const blobCache: BlobCacheManager = {
  /**
   * Get Blob cache (list of in-use object URLs)
   *
   * @returns List of URLs
   */
  get(): URL[] {
    return JSON.parse(localStorage.blobCache || '[]').map(
      (u: string) => new URL(u),
    );
  },
  /**
   * Write to Blob cache
   *
   * @param cache - Cache
   */
  set(cache: URL[] | string[]): void {
    localStorage.blobCache = JSON.stringify(cache);
  },
  /** Clear Blob cache */
  clear(): void {
    this.get().forEach((url) => {
      URL.revokeObjectURL(url as unknown as string);
    });
    this.set([]);
  },
};

export default blobCache;
