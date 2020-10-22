"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_allsettled_1 = __importDefault(require("promise.allsettled"));
const conflux_1 = require("@transcend-io/conflux");
const streamsaver_1 = require("streamsaver");
const mime_types_1 = __importDefault(require("mime-types"));
/** Compression levels */
var Compression;
(function (Compression) {
    /** No compression */
    Compression[Compression["Store"] = 0] = "Store";
    /** Low compression */
    Compression[Compression["Low"] = 1] = "Low";
    /** Medium compression */
    Compression[Compression["Medium"] = 2] = "Medium";
    /** High compression */
    Compression[Compression["High"] = 3] = "High";
})(Compression = exports.Compression || (exports.Compression = {}));
/** Wrapped WritableStream for state keeping with StreamSaver */
class PenumbraZipWriter {
    /**
     * Penumbra zip writer constructor
     *
     * @param options - ZipOptions
     * @returns PenumbraZipWriter class instance
     */
    constructor(options = {}) {
        /** Conflux zip writer instance */
        this.conflux = new conflux_1.Writer();
        /** Conflux WritableStream interface */
        this.writer = this.conflux.writable.getWriter();
        /** Save completion state */
        this.closed = false;
        /** Debug mode */
        this.debug = false;
        /** Pending unfinished write() calls */
        this.pendingWrites = [];
        const { name = 'download', size, files, controller = new AbortController(), compressionLevel = Compression.Store, debug = false, } = options;
        if (compressionLevel !== Compression.Store) {
            throw new Error(
            // eslint-disable-next-line max-len
            "penumbra.saveZip() doesn't support compression yet. Voice your support here: https://github.com/transcend-io/penumbra/issues");
        }
        this.controller = controller;
        const { signal } = controller;
        signal.addEventListener('abort', () => {
            this.close();
        }, {
            once: true,
        });
        const saveStream = streamsaver_1.createWriteStream(
        // Append .zip to filename unless it is already present
        /\.zip\s*$/i.test(name) ? name : `${name}.zip`, size);
        const { readable } = this.conflux;
        const [zipStream, debugZipStream] = debug ? readable.tee() : [readable, null];
        zipStream.pipeTo(saveStream, { signal });
        // Buffer zip stream for debug & testing
        if (debug && debugZipStream) {
            this.debug = debug;
            this.debugZipBuffer = new Response(debugZipStream).arrayBuffer();
        }
        if (files) {
            this.write(...files);
        }
    }
    /**
     * Add decrypted PenumbraFiles to zip
     *
     * @param files - Decrypted PenumbraFile[] to add to zip
     */
    write(...files) {
        return promise_allsettled_1.default(files.map(async ({ path, filePrefix, stream, mimetype, lastModified = new Date(), }) => {
            const name = path || filePrefix;
            if (!name) {
                throw new Error('PenumbraZipWriter.write(): Unable to determine filename');
            }
            const hasExtension = /[^/]*\.\w+$/.test(name);
            const fullPath = `${name}${hasExtension ? '' : mime_types_1.default.extension(mimetype)}`;
            const reader = (stream instanceof ReadableStream
                ? stream
                : new Response(stream).body).getReader();
            const writeComplete = new Promise((resolve) => {
                const completionTrackerStream = new ReadableStream({
                    /** Start completion tracker-wrapped ReadableStream */
                    async start(controller) {
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            // eslint-disable-next-line no-await-in-loop
                            const { done, value } = await reader.read();
                            // When no more data needs to be consumed, break the reading
                            if (done) {
                                resolve();
                                break;
                            }
                            // Enqueue the next data chunk into our target stream
                            controller.enqueue(value);
                        }
                        // Close the stream
                        controller.close();
                        reader.releaseLock();
                    },
                });
                this.writer.write({
                    name: fullPath,
                    lastModified,
                    stream: () => completionTrackerStream,
                });
            });
            this.pendingWrites.push(writeComplete);
            return writeComplete;
        }));
    }
    /** Enqueue closing of the Penumbra zip writer (after pending writes finish) */
    async close() {
        const writes = await promise_allsettled_1.default(this.pendingWrites);
        if (!this.closed) {
            this.writer.close();
            this.closed = true;
        }
        return writes;
    }
    /** Cancel Penumbra zip writer */
    abort() {
        if (!this.controller.signal.aborted) {
            this.controller.abort();
        }
    }
    /** Get buffered output (requires debug mode) */
    getBuffer() {
        if (!this.closed) {
            throw new Error('getBuffer() can only be called when a PenumbraZipWriter is closed');
        }
        if (!this.debug || !this.debugZipBuffer) {
            throw new Error('getBuffer() can only be called on a PenumbraZipWriter in debug mode');
        }
        return this.debugZipBuffer;
    }
}
exports.PenumbraZipWriter = PenumbraZipWriter;
/**
 * Zip files retrieved by Penumbra
 *
 * @param options - ZipOptions
 * @returns PenumbraZipWriter class instance
 */
function saveZip(options) {
    return new PenumbraZipWriter(options);
}
exports.saveZip = saveZip;
//# sourceMappingURL=zip.js.map