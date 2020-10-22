"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// external modules
const crypto_browserify_1 = require("crypto-browserify");
const typedarray_to_buffer_1 = __importDefault(require("typedarray-to-buffer"));
const web_streams_node_1 = require("web-streams-node");
// utils
const utils_1 = require("./utils");
const emitJobCompletion_1 = __importDefault(require("./utils/emitJobCompletion"));
/* tslint:disable completed-docs */
// external modules
/**
 * Encrypts a readable stream
 *
 * @param rs - A readable stream of encrypted data
 * @param cipher - The crypto module's cipher
 * @param contentLength - The content length of the file, in bytes
 * @param url - The URL to read the encrypted file from (only used for the event emitter)
 * @returns A readable stream of decrypted data
 */
function encryptStream(jobID, rs, cipher, contentLength, key, iv) {
    const stream = rs instanceof ReadableStream ? rs : web_streams_node_1.toWebReadableStream(rs);
    let totalBytesRead = 0;
    // TransformStreams are supported
    if ('TransformStream' in self) {
        return stream.pipeThrough(
        // eslint-disable-next-line no-undef
        new TransformStream({
            transform: async (chunk, controller) => {
                const bufferChunk = typedarray_to_buffer_1.default(chunk);
                // Encrypt chunk and send it out
                const encryptedChunk = cipher.update(bufferChunk);
                controller.enqueue(encryptedChunk);
                // Emit a progress update
                totalBytesRead += bufferChunk.length;
                utils_1.emitProgress('encrypt', totalBytesRead, contentLength, '[encrypted file]');
                if (totalBytesRead >= contentLength) {
                    cipher.final();
                    const authTag = cipher.getAuthTag();
                    emitJobCompletion_1.default(jobID, {
                        key,
                        iv,
                        authTag,
                    });
                }
            },
        }));
    }
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
                        controller.close();
                        return;
                    }
                    const chunk = typedarray_to_buffer_1.default(value);
                    // Encrypt chunk
                    const encryptedChunk = cipher.update(chunk);
                    controller.enqueue(encryptedChunk);
                    push();
                    // Emit a progress update
                    totalBytesRead += chunk.length;
                    utils_1.emitProgress('encrypt', totalBytesRead, contentLength, '[encrypted file]');
                    if (totalBytesRead >= contentLength) {
                        cipher.final();
                        const authTag = cipher.getAuthTag();
                        emitJobCompletion_1.default(jobID, {
                            key,
                            iv,
                            authTag,
                        });
                    }
                });
            }
            push();
        },
    });
}
exports.encryptStream = encryptStream;
/** Encrypt a buffer */
function encryptBuffer() {
    console.error('penumbra encryptBuffer() is not yet implemented');
    return new ArrayBuffer(10);
}
exports.encryptBuffer = encryptBuffer;
const GENERATED_KEY_RANDOMNESS = 256;
// Minimum IV randomness set by NIST
const IV_RANDOMNESS = 12;
/**
 * Encrypts a file and returns a ReadableStream
 *
 * @param file - The remote resource to download
 * @returns A readable stream of the deciphered file
 */
function encrypt(options, file, 
// eslint-disable-next-line no-undef
size) {
    // Generate a key if one is not provided
    if (!options || !options.key) {
        console.debug(`penumbra.encrypt(): no key specified. generating a random ${GENERATED_KEY_RANDOMNESS}-bit key`);
        // eslint-disable-next-line no-param-reassign
        options = {
            ...options,
            key: Buffer.from(crypto.getRandomValues(new Uint8Array(GENERATED_KEY_RANDOMNESS / 8))),
        };
    }
    const { id } = file;
    // eslint-disable-next-line no-param-reassign
    size = file.size || size;
    // Convert to Buffers
    const key = utils_1.toBuff(options.key);
    const iv = Buffer.from(options.iv
        ? utils_1.toBuff(options.iv)
        : crypto.getRandomValues(new Uint8Array(IV_RANDOMNESS)));
    // Construct the decipher
    const cipher = crypto_browserify_1.createCipheriv('aes-256-gcm', key, iv);
    // Encrypt the stream
    return {
        ...file,
        // stream:
        //   file.stream instanceof ReadableStream
        //     ? encryptStream(file.stream, cipher, size)
        //     : encryptBuffer(file.stream, cipher),
        stream: encryptStream(id, utils_1.intoStreamOnlyOnce(file.stream), cipher, size, key, iv),
        id,
    };
}
exports.default = encrypt;
//# sourceMappingURL=encrypt.js.map