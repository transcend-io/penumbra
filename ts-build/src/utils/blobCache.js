"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Get Blob cache (list of in-use object URLs) */
const blobCache = {
    /** Get Blob cache (list of in-use object URLs) */
    get() {
        return JSON.parse(localStorage.blobCache || '[]').map((u) => new URL(u));
    },
    /** Write to Blob cache */
    set(cache) {
        localStorage.blobCache = JSON.stringify(cache);
    },
    /** Clear Blob cache */
    clear() {
        this.get().forEach((url) => {
            URL.revokeObjectURL(url);
        });
        this.set([]);
    },
};
exports.default = blobCache;
//# sourceMappingURL=blobCache.js.map