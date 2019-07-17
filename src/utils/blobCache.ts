/** Get Blob cache (list of in-use object URLs) */
export const getBlobCache = (): URL[] =>
  JSON.parse(localStorage.blobCache || '[]').map((u: string) => new URL(u));
/** Write to Blob cache */
export const setBlobCache = (cache: URL[] | string[]): void => {
  localStorage.blobCache = JSON.stringify(cache);
};
/** Clear Blob cache */
export const clearBlobCache = (): void => {
  getBlobCache().forEach((url: URL) => {
    URL.revokeObjectURL(String(url));
  });
  setBlobCache([]);
};
