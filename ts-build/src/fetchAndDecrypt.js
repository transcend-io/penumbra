"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable import/extensions */
// external modules
const crypto_browserify_1 = require("crypto-browserify");
// local
const decrypt_1 = __importDefault(require("./decrypt"));
const error_1 = require("./error");
const utils_1 = require("./utils");
const emitError_1 = __importDefault(require("./utils/emitError"));
/**
 * Fetches a remote file from a URL, deciphers it (if encrypted), and returns a ReadableStream
 *
 * @param resource - The remote resource to download
 * @param fetchOptions - Options to include in the download URL fetch. Set to `{ credentials: 'include' }` to include credentials for a CORS request.
 * @returns A readable stream of the deciphered file
 */
function fetchAndDecrypt({ url, decryptionOptions }, fetchOptions) {
    return (fetch(url, fetchOptions)
        // Retrieve ReadableStream body
        .then((response) => {
        if (response.status >= 400) {
            const err = new error_1.PenumbraError(`Received invalid status code: ${response.status} -- ${response.body}`, url);
            emitError_1.default(err);
            throw err;
        }
        // Throw an error if we have no body to parse
        if (!response.body) {
            const err = new error_1.PenumbraError('Response body is empty!', url);
            emitError_1.default(err);
            throw err;
        }
        // If the file is unencrypted, simply return the readable stream
        if (!decryptionOptions) {
            return response.body;
        }
        // Else we need to decrypt the blob
        const { iv, authTag, key } = decryptionOptions;
        // Convert to buffers
        const bufferKey = utils_1.toBuff(key);
        // Grab from header if possible
        const bufferIv = utils_1.toBuff(response.headers.get('x-penumbra-iv') || iv);
        const bufferAuthTag = utils_1.toBuff(authTag);
        // Construct the decipher
        const decipher = crypto_browserify_1.createDecipheriv('aes-256-gcm', bufferKey, bufferIv);
        decipher.setAuthTag(bufferAuthTag);
        // Decrypt the stream
        return decrypt_1.default(response.body, decipher, Number(response.headers.get('Content-Length') || '0'), url);
    }));
}
exports.default = fetchAndDecrypt;
//# sourceMappingURL=fetchAndDecrypt.js.map