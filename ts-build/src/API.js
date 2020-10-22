"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable max-lines */
// Remote
const comlink_1 = require("comlink");
const remote_web_streams_1 = require("remote-web-streams");
const web_streams_node_1 = require("web-streams-node");
const streamsaver_1 = require("streamsaver");
const file_saver_1 = require("file-saver");
const utils_1 = require("./utils");
const workers_1 = require("./workers");
const ua_support_1 = require("./ua-support");
const zip_1 = require("./zip");
const resolver = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
const writableStreamsSupported = 'WritableStream' in self;
/**
 * Retrieve and decrypt files (batch job)
 */
async function getJob(...resources) {
    if (resources.length === 0) {
        throw new Error('penumbra.get() called without arguments');
    }
    if (writableStreamsSupported) {
        // WritableStream constructor supported
        const worker = await workers_1.getWorker();
        const DecryptionChannel = worker.comlink;
        const remoteStreams = resources.map(() => new remote_web_streams_1.RemoteReadableStream());
        const readables = remoteStreams.map((stream, i) => {
            const { url } = resources[i];
            resolver.href = url;
            const path = resolver.pathname; // derive path from URL
            return {
                stream: stream.readable,
                path,
                // derived path is overridden if PenumbraFile contains path
                ...resources[i],
            };
        });
        const writablePorts = remoteStreams.map(({ writablePort }) => writablePort);
        new DecryptionChannel().then(async (thread) => {
            await thread.get(comlink_1.transfer(writablePorts, writablePorts), resources);
        });
        return readables;
    }
    // let decryptedFiles: PenumbraFile[] = await new DecryptionChannel().then(
    //   async (thread: PenumbraWorkerAPI) => {
    //     const buffers = await thread.getBuffers(resources);
    //     decryptedFiles = buffers.map((stream, i) => {
    //       const { url } = resources[i];
    //       resolver.href = url;
    //       const path = resolver.pathname;
    //       return {
    //         stream,
    //         path,
    //         ...resources[i],
    //       };
    //     });
    //     return decryptedFiles;
    //   },
    // );
    const { default: fetchAndDecrypt } = await Promise.resolve().then(() => __importStar(require('./fetchAndDecrypt')));
    /**
     * Fetch remote files from URLs, decipher them (if encrypted),
     * fully buffer the response, and return ArrayBuffer[]
     */
    const decryptedFiles = await Promise.all(resources.map(async (resource) => {
        if (!('url' in resource)) {
            throw new Error('penumbra.get(): RemoteResource missing URL');
        }
        return {
            stream: await new Response(await fetchAndDecrypt(resource)).arrayBuffer(),
            ...resource,
        };
    }));
    return decryptedFiles;
}
/**
 * penumbra.get() API
 *
 * ```ts
 * // Load a resource and get a ReadableStream
 * await penumbra.get(resource);
 *
 * // Buffer all responses & read them as text
 * await Promise.all((await penumbra.get(resources)).map(({ stream }) =>
 *  new Response(stream).text()
 * ));
 *
 * // Buffer a response & read as text
 * await new Response((await penumbra.get(resource))[0].stream).text();
 *
 * // Example call with an included resource
 * await penumbra.get({
 *   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
 *   filePrefix: 'NYT',
 *   mimetype: 'text/plain',
 *   decryptionOptions: {
 *     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
 *     iv: '6lNU+2vxJw6SFgse',
 *     authTag: 'gadZhS1QozjEmfmHLblzbg==',
 *   },
 * });
 * ```
 */
function get(...resources) {
    return Promise.all(resources.map(async (resource) => (await getJob(resource))[0]));
}
exports.get = get;
const DEFAULT_FILENAME = 'download';
const DEFAULT_MIME_TYPE = 'application/octet-stream';
/** Maximum allowed resource size for encrypt/decrypt on the main thread */
const MAX_ALLOWED_SIZE_MAIN_THREAD = 16 * 1024 * 1024; // 16 MiB
const isNumber = (number) => !isNaN(number);
/**
 * Save files retrieved by Penumbra
 *
 * @param data - The data files to save
 * @param fileName - The name of the file to save to
 * @returns AbortController
 */
function save(files, fileName, controller = new AbortController()) {
    let size = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
        if (!isNumber(file.size)) {
            size = undefined;
            break;
        }
        size += file.size;
    }
    if ('length' in files && files.length > 1) {
        const writer = zip_1.saveZip({
            name: fileName || `${DEFAULT_FILENAME}.zip`,
            size,
            files,
            controller,
        });
        writer.write(...files);
        return controller;
    }
    const file = 'stream' in files ? files : files[0];
    // TODO: get filename extension with mime.extension()
    const singleFileName = fileName || file.filePrefix || DEFAULT_FILENAME;
    const { signal } = controller;
    // Write a single readable stream to file
    if (file.stream instanceof ReadableStream) {
        file.stream.pipeTo(streamsaver_1.createWriteStream(singleFileName), { signal });
    }
    else if (file.stream instanceof ArrayBuffer) {
        file_saver_1.saveAs(new Blob([new Uint8Array(file.stream, 0, file.stream.byteLength)]), singleFileName);
    }
    return controller;
}
/**
 * Load files retrieved by Penumbra into memory as a Blob
 *
 * @param data - The data to load
 * @returns A blob of the data
 */
async function getBlob(files, type) {
    if ('length' in files && files.length > 1) {
        throw new Error('penumbra.getBlob(): Called with multiple files');
    }
    let rs;
    let fileType;
    if (files instanceof ReadableStream) {
        rs = files;
    }
    else {
        const file = 'length' in files ? files[0] : files;
        if (file.stream instanceof ArrayBuffer) {
            return new Blob([new Uint8Array(file.stream, 0, file.stream.byteLength)]);
        }
        rs = file.stream;
        fileType = file.mimetype;
    }
    const headers = new Headers({
        'Content-Type': type || fileType || DEFAULT_MIME_TYPE,
    });
    return new Response(rs, { headers }).blob();
}
let jobID = 0;
const decryptionConfigs = new Map();
const trackJobCompletion = (searchForID) => new Promise((complete) => {
    const listener = ({ type, detail: { id, decryptionInfo }, }) => {
        decryptionConfigs.set(id, decryptionInfo);
        if (typeof searchForID !== 'undefined' && `${id}` === `${searchForID}`) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            self.removeEventListener(type, listener);
            complete(decryptionInfo);
        }
    };
    self.addEventListener('penumbra-complete', listener);
});
/**
 * Get the decryption config for an encrypted file
 *
 * ```ts
 * penumbra.getDecryptionInfo(file: PenumbraEncryptedFile): Promise<PenumbraDecryptionInfo>
 * ```
 */
async function getDecryptionInfo(file) {
    const { id } = file;
    if (!decryptionConfigs.has(id)) {
        // decryption config not yet received. waiting for event with promise
        return trackJobCompletion(id);
    }
    return decryptionConfigs.get(id);
}
exports.getDecryptionInfo = getDecryptionInfo;
/**
 * Encrypt files (batch job)
 */
async function encryptJob(options, ...files) {
    // Ensure a file is passed
    if (files.length === 0) {
        throw new Error('penumbra.encrypt() called without arguments');
    }
    // Ensure readable streams
    if (files.some((file) => file.stream instanceof ArrayBuffer)) {
        throw new Error('penumbra.encrypt() only supports ReadableStreams');
    }
    // collect file sizes and assign job IDs for completion tracking
    const ids = [];
    const sizes = [];
    files.forEach((file) => {
        // eslint-disable-next-line no-plusplus, no-param-reassign
        ids.push((file.id = jobID++));
        const { size } = file;
        if (size) {
            sizes.push(size);
        }
        else {
            throw new Error('penumbra.encrypt(): Unable to determine file size');
        }
    });
    // We stream the encryption if supported by the browser
    if (writableStreamsSupported) {
        // WritableStream constructor supported
        const worker = await workers_1.getWorker();
        const EncryptionChannel = worker.comlink;
        const remoteReadableStreams = files.map(() => new remote_web_streams_1.RemoteReadableStream());
        const remoteWritableStreams = files.map(() => new remote_web_streams_1.RemoteWritableStream());
        // extract ports from remote readable/writable streams for Comlink.transfer
        const readablePorts = remoteWritableStreams.map(({ readablePort }) => readablePort);
        const writablePorts = remoteReadableStreams.map(({ writablePort }) => writablePort);
        // enter worker thread and grab the metadata
        await new EncryptionChannel().then(
        /**
         * PenumbraWorkerAPI.encrypt calls require('./encrypt').encrypt()
         * from the worker thread and starts reading the input stream from
         * [remoteWritableStream.writable]
         */
        (thread) => {
            thread.encrypt(options, ids, sizes, comlink_1.transfer(readablePorts, readablePorts), comlink_1.transfer(writablePorts, writablePorts));
        });
        // encryption jobs submitted and still processing
        remoteWritableStreams.forEach((remoteWritableStream, i) => {
            // pipe input files into remote writable streams for worker
            (files[i].stream instanceof ReadableStream
                ? files[i].stream
                : web_streams_node_1.toWebReadableStream(utils_1.intoStreamOnlyOnce(files[i].stream))).pipeTo(remoteWritableStream.writable);
        });
        // construct output files with corresponding remote readable streams
        const readables = remoteReadableStreams.map((stream, i) => ({
            ...files[i],
            // iv: metadata[i].iv,
            stream: stream.readable,
            size: sizes[i],
            id: ids[i],
        }));
        return readables;
    }
    // throw new Error(
    //   "Your browser doesn't support streaming encryption. Buffered encryption is not yet supported.",
    // );
    const filesWithIds = files;
    let totalSize = 0;
    filesWithIds.forEach(({ size = 0 }) => {
        totalSize += size;
        if (totalSize > MAX_ALLOWED_SIZE_MAIN_THREAD) {
            console.error(`Your browser doesn't support streaming encryption.`);
            throw new Error('penumbra.encrypt(): File is too large to encrypt without writable streams');
        }
    });
    const { default: encryptFile } = await Promise.resolve().then(() => __importStar(require('./encrypt')));
    const encryptedFiles = await Promise.all(filesWithIds.map((file) => {
        const { stream } = encryptFile(options, file, file.size);
        return {
            stream,
            ...file,
            ...options,
        };
    }));
    return encryptedFiles;
}
/**
 * penumbra.encrypt() API
 *
 * ```ts
 * await penumbra.encrypt(options, ...files);
 * // usage example:
 * size = 4096 * 64 * 64;
 * addEventListener('penumbra-progress',(e)=>console.log(e.type, e.detail));
 * addEventListener('penumbra-complete',(e)=>console.log(e.type, e.detail));
 * file = penumbra.encrypt(null, {stream:intoStream(new Uint8Array(size)), size});
 * let data = [];
 * file.then(async ([encrypted]) => {
 *   console.log('encryption started');
 *   data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
 * });
 * ```
 */
function encrypt(options, ...files) {
    return Promise.all(files.map(async (file) => (await encryptJob(options, file))[0]));
}
exports.encrypt = encrypt;
/**
 * Decrypt files encrypted by penumbra.encrypt() (batch job)
 */
async function decryptJob(options, ...files) {
    if (files.length === 0) {
        throw new Error('penumbra.decrypt() called without arguments');
    }
    if (writableStreamsSupported) {
        // WritableStream constructor supported
        const worker = await workers_1.getWorker();
        const DecryptionChannel = worker.comlink;
        const remoteReadableStreams = files.map(() => new remote_web_streams_1.RemoteReadableStream());
        const remoteWritableStreams = files.map(() => new remote_web_streams_1.RemoteWritableStream());
        const ids = [];
        const sizes = [];
        // collect file sizes and assign job IDs for completion tracking
        files.forEach((file) => {
            // eslint-disable-next-line no-plusplus, no-param-reassign
            ids.push((file.id = file.id || jobID++));
            const { size } = file;
            if (size) {
                sizes.push(size);
            }
            else {
                throw new Error('penumbra.decrypt(): Unable to determine file size');
            }
        });
        // extract ports from remote readable/writable streams for Comlink.transfer
        const readablePorts = remoteWritableStreams.map(({ readablePort }) => readablePort);
        const writablePorts = remoteReadableStreams.map(({ writablePort }) => writablePort);
        // enter worker thread
        await new DecryptionChannel().then(async (thread) => {
            /**
             * PenumbraWorkerAPI.decrypt calls require('./decrypt').decrypt()
             * from the worker thread and starts reading the input stream from
             * [remoteWritableStream.writable]
             */
            thread.decrypt(options, ids, sizes, comlink_1.transfer(readablePorts, readablePorts), comlink_1.transfer(writablePorts, writablePorts));
        });
        // encryption jobs submitted and still processing
        remoteWritableStreams.forEach((remoteWritableStream, i) => {
            // pipe input files into remote writable streams for worker
            (files[i].stream instanceof ReadableStream
                ? files[i].stream
                : web_streams_node_1.toWebReadableStream(utils_1.intoStreamOnlyOnce(files[i].stream))).pipeTo(remoteWritableStream.writable);
        });
        // construct output files with corresponding remote readable streams
        const readables = remoteReadableStreams.map((stream, i) => ({
            ...files[i],
            stream: stream.readable,
            size: sizes[i],
            id: ids[i],
        }));
        return readables;
    }
    files.forEach(({ size = 0 }) => {
        if (size > MAX_ALLOWED_SIZE_MAIN_THREAD) {
            console.error(`Your browser doesn't support streaming decryption.`);
            throw new Error('penumbra.decrypt(): File is too large to decrypt without writable streams');
        }
    });
    // let decryptedFiles: PenumbraFile[] = await new DecryptionChannel().then(
    //   async (thread: PenumbraWorkerAPI) => {
    //     const buffers = await thread.getBuffers(options, files);
    //     decryptedFiles = buffers.map((stream, i) => ({
    //       stream,
    //       ...files[i],
    //     }));
    //     return decryptedFiles;
    //   },
    // );
    const { decrypt: decryptFile } = await Promise.resolve().then(() => __importStar(require('./decrypt')));
    const decryptedFiles = await Promise.all(files.map(async (file) => decryptFile(options, file, file.size)));
    return decryptedFiles;
}
/**
 * penumbra.decrypt() API
 *
 * Decrypts files encrypted by penumbra.encrypt()
 *
 * ```ts
 * await penumbra.decrypt(options, ...files);
 * // usage example:
 * size = 4096 * 64 * 64;
 * addEventListener('penumbra-progress',(e)=>console.log(e.type, e.detail));
 * addEventListener('penumbra-complete',(e)=>console.log(e.type, e.detail));
 * file = penumbra.encrypt(null, {stream:intoStream(new Uint8Array(size)), size});
 * let data = [];
 * file.then(async ([encrypted]) => {
 *   console.log('encryption started');
 *   data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
 * });
 */
async function decrypt(options, ...files) {
    return Promise.all(files.map(async (file) => (await decryptJob(options, file))[0]));
}
exports.decrypt = decrypt;
/**
 * Get file text (if content is viewable) or URI (if content is not viewable)
 *
 * @param files - A list of files to get the text of
 * @returns A list with the text itself or a URI encoding the file if applicable
 */
function getTextOrURI(files) {
    return files.map(async (file) => {
        const { mimetype } = file;
        if (utils_1.isViewableText(mimetype)) {
            return {
                type: 'text',
                data: await new Response(file.stream).text(),
                mimetype,
            };
        }
        const url = URL.createObjectURL(await getBlob(file));
        const cache = utils_1.blobCache.get();
        cache.push(new URL(url));
        utils_1.blobCache.set(cache);
        return { type: 'uri', data: url, mimetype };
    });
}
const penumbra = {
    get,
    encrypt,
    decrypt,
    getDecryptionInfo,
    save,
    supported: ua_support_1.supported,
    getBlob,
    getTextOrURI,
    saveZip: zip_1.saveZip,
    setWorkerLocation: workers_1.setWorkerLocation,
};
exports.default = penumbra;
//# sourceMappingURL=API.js.map