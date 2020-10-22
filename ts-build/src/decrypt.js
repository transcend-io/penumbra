"use strict";
/* tslint:disable completed-docs */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_browserify_1 = require("crypto-browserify");
const typedarray_to_buffer_1 = __importDefault(require("typedarray-to-buffer"));
// utils
const web_streams_node_1 = require("web-streams-node");
const utils_1 = require("./utils");
/**
 * Decrypts a readable stream
 *
 * @param rs - A readable stream of encrypted data
 * @param decipher - The crypto module's decipher
 * @param contentLength - The content length of the file, in bytes
 * @param id - The ID number (for arbitrary decryption) or URL to read the encrypted file from (only used for the event emitter)
 * @returns A readable stream of decrypted data
 */
function decryptStream(rs, decipher, contentLength, id) {
    const stream = rs instanceof ReadableStream ? rs : web_streams_node_1.toWebReadableStream(rs);
    let totalBytesRead = 0;
    // TransformStreams are supported
    if ('TransformStream' in self) {
        return stream.pipeThrough(
        // eslint-disable-next-line no-undef
        new TransformStream({
            transform: async (chunk, controller) => {
                const bufferChunk = typedarray_to_buffer_1.default(chunk);
                // Decrypt chunk and send it out
                const decryptedChunk = decipher.update(bufferChunk);
                controller.enqueue(decryptedChunk);
                // Emit a progress update
                totalBytesRead += bufferChunk.length;
                utils_1.emitProgress('decrypt', totalBytesRead, contentLength, id);
                // TODO lazy auth tag from response trailer
                // if (totalBytesRead >= contentLength) {
                //   decipher.final();
                // }
            },
        }));
    }
    let finished = false;
    // TransformStream not supported, revert to ReadableStream
    const reader = stream.getReader();
    return new ReadableStream({
        /**
         * Controller
         */
        start(controller) {
            /**
             * Push on
             */
            function push() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        if (!finished) {
                            controller.close();
                            finished = true;
                        }
                        return;
                    }
                    const chunk = typedarray_to_buffer_1.default(value);
                    // Decrypt chunk
                    const decValue = decipher.update(chunk);
                    // Emit a progress update
                    totalBytesRead += chunk.length;
                    utils_1.emitProgress('decrypt', totalBytesRead, contentLength, id);
                    controller.enqueue(decValue);
                    push();
                });
            }
            push();
        },
    });
}
exports.default = decryptStream;
/**
 * Decrypts a file and returns a ReadableStream
 *
 * @param file - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
function decrypt(options, file, 
// eslint-disable-next-line no-undef
size) {
    if (!options || !options.key || !options.iv || !options.authTag) {
        throw new Error('penumbra.decrypt(): missing decryption options');
    }
    const { id } = file;
    // eslint-disable-next-line no-param-reassign
    size = file.size || size;
    // Convert to Buffers
    const key = options.key instanceof Buffer ? options.key : utils_1.toBuff(options.key);
    const iv = options.iv instanceof Buffer ? options.iv : Buffer.from(options.iv);
    const authTag = options.authTag instanceof Buffer
        ? options.authTag
        : utils_1.toBuff(options.authTag);
    // Construct the decipher
    const decipher = crypto_browserify_1.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    // Encrypt the stream
    return {
        ...file,
        // stream:
        //   file.stream instanceof ReadableStream
        //     ? encryptStream(file.stream, cipher, size)
        //     : encryptBuffer(file.stream, cipher),
        stream: decryptStream(utils_1.intoStreamOnlyOnce(file.stream), 
        /** TODO: address this TypeScript confusion  */
        decipher, size, id),
        id,
    };
}
exports.decrypt = decrypt;
//# sourceMappingURL=decrypt.js.map