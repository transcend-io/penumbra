"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_id_1 = require("./worker-id");
/** Penumbra error class */
class PenumbraError extends Error {
    /** Extend new Error */
    constructor(error, id) {
        if (typeof error === 'string') {
            super(error);
        }
        else {
            const { message } = error;
            super(message);
            Object.keys(error).forEach((key) => {
                if (key !== 'message') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    this[key] = error[key];
                }
            });
        }
        this.id = id;
        this.worker = worker_id_1.getWorkerID();
        this.name = 'PenumbraError';
    }
    /** Error name */
    get [Symbol.toStringTag]() {
        return this.name;
    }
}
exports.PenumbraError = PenumbraError;
//# sourceMappingURL=error.js.map