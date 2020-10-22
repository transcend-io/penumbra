/** Penumbra error class */
export declare class PenumbraError extends Error {
    /** The download URL or job ID throwing an error */
    id: string | number;
    /** The worker ID associated with this error */
    worker: number | null;
    /** Extend new Error */
    constructor(error: string | Error, id: string | number);
    /** Error name */
    get [Symbol.toStringTag](): string;
}
//# sourceMappingURL=error.d.ts.map