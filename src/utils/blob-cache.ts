/** Blob cache manager */
interface BlobCacheManager {
  /** Get Blob cache (list of in-use object URLs) */
  get: () => URL[];
  /** Write to Blob cache */
  set: (cache: URL[] | string[]) => void;
  /** Clear Blob cache */
  clear: () => void;
}

/** Get Blob cache (list of in-use object URLs) */
const blobCache: BlobCacheManager = {
  /**
   * Get Blob cache (list of in-use object URLs)
   * @returns List of URLs
   */
  get(): URL[] {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unsafe-argument
    const parsed: unknown = JSON.parse(localStorage['blobCache'] || '[]');
    if (
      !Array.isArray(parsed) ||
      parsed.some((url) => !(url instanceof URL) && typeof url !== 'string')
    ) {
      throw new TypeError('Invalid blob cache');
    }
    return (parsed as (string | URL)[]).map((url) => new URL(url));
  },
  /**
   * Write to Blob cache
   * @param cache - Cache
   */
  set(cache: URL[] | string[]): void {
    localStorage['blobCache'] = JSON.stringify(cache);
  },
  /** Clear Blob cache */
  clear(): void {
    for (const url of this.get()) {
      URL.revokeObjectURL(url as unknown as string);
    }
    this.set([]);
  },
};

export default blobCache;
