"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// External modules
var file_saver_1 = require("file-saver");
var crypto_browserify_1 = require("crypto-browserify");
var streamsaver_1 = require("streamsaver");
var toBuffer = require("typedarray-to-buffer");
var scope;
try {
    // On the main scope
    scope = window;
}
catch (err) {
    // This is in a service worker
    scope = self;
}
/**
 * Fetches an encrypted file from a URL deciphers it, and returns a ReadableStream
 * @param url the URL to fetch an encrypted file from
 * @param key the decryption key to use for this encrypted file, as a Buffer or base64-encoded string
 * @param iv the initialization vector for this encrypted file, as a Buffer or base64-encoded string
 * @param authTag the authentication tag for this encrypted file, as a Buffer or base64-encoded string
 * @returns a readable stream of the deciphered file
 */
function fetchAndDecipher(url, key, iv, authTag) {
    if (typeof key === 'string')
        key = Buffer.from(key, 'base64');
    if (typeof iv === 'string')
        iv = Buffer.from(iv, 'base64');
    if (typeof authTag === 'string')
        authTag = Buffer.from(authTag, 'base64');
    var decipher = crypto_browserify_1.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return (fetch(url)
        // Retrieve its body as ReadableStream
        .then(function (response) {
        if (response.body === null)
            throw new Error('Response body is empty!');
        var contentLength = response.headers.get('Content-Length');
        return decryptStream(response.body, decipher, Number(contentLength), url);
    }));
}
/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param url the URL being read from
 * @returns
 */
function emitProgress(totalBytesRead, contentLength, url) {
    var percent = Math.round((totalBytesRead / contentLength) * 100);
    var event = new CustomEvent(url, {
        detail: {
            percent: percent,
            totalBytesRead: totalBytesRead,
            contentLength: contentLength,
        },
    });
    scope.dispatchEvent(event);
}
/**
 * Decrypts a readable stream
 * @param rs a readable stream of encrypted data
 * @param decipher the crypto module's decipher
 * @param contentLength the content length of the file, in bytes
 * @param url the URL to read the encrypted file from (only used for the event emitter)
 * @returns a readable stream of decrypted data
 */
function decryptStream(rs, decipher, contentLength, url) {
    // TODO check authTag with decipher.final
    var _this = this;
    var totalBytesRead = 0;
    // TransformStreams are supported
    if ('TransformStream' in scope) {
        return rs.pipeThrough(new TransformStream({
            transform: function (chunk, controller) { return __awaiter(_this, void 0, void 0, function () {
                var decryptedChunk;
                return __generator(this, function (_a) {
                    chunk = toBuffer(chunk);
                    decryptedChunk = decipher.update(chunk);
                    controller.enqueue(decryptedChunk);
                    // Emit a progress update
                    totalBytesRead += chunk.length;
                    emitProgress(totalBytesRead, contentLength, url);
                    return [2 /*return*/];
                });
            }); },
        }));
    }
    // TransformStream not supported, revert to ReadableStream
    var reader = rs.getReader();
    return new ReadableStream({
        start: function (controller) {
            function push() {
                reader.read().then(function (_a) {
                    var done = _a.done, value = _a.value;
                    if (done) {
                        controller.close();
                        return;
                    }
                    var chunk = toBuffer(value);
                    // Decrypt chunk
                    var decValue = decipher.update(chunk);
                    // Emit a progress update
                    totalBytesRead += chunk.length;
                    emitProgress(totalBytesRead, contentLength, url);
                    controller.enqueue(decValue);
                    push();
                });
            }
            push();
        },
    });
}
/**
 * Saves a readable stream to disk from the browser
 * @param rs a stream of bytes to be saved to disk
 * @param fileName the name of the file to save
 * @returns
 */
function saveFile(rs, fileName) {
    // Feature detection for WritableStream - streams straight to disk
    if ('WritableStream' in scope)
        return saveFileStream(rs, fileName);
    // No WritableStream; load into memory with a Blob
    return new Response(rs).blob().then(function (blob) { return file_saver_1.saveAs(blob, fileName); });
}
/**
 * Streams a readable stream to disk
 * @param rs a stream of bytes to be saved to disk
 * @param fileName the name of the file to save
 * @returns
 */
function saveFileStream(rs, fileName) {
    var fileStream = streamsaver_1.createWriteStream(fileName);
    var writer = fileStream.getWriter();
    // Feature detection for pipeTo (more efficient)
    if (rs.pipeTo) {
        // like as we never did fileStream.getWriter()
        writer.releaseLock();
        return rs.pipeTo(fileStream);
    }
    var reader = rs.getReader();
    var pump = function () {
        return reader.read().then(function (_a) {
            var value = _a.value, done = _a.done;
            return done
                // Close the stream so we stop writing
                ? writer.close()
                // Write one chunk, then get the next one
                : writer.write(value).then(pump);
        });
    };
    // Start the reader
    return pump();
}
/**
 * Returns an object URL to display media directly on a webpage
 * @param rs a readable stream of decrypted bytes
 * @returns the object URL to be added to an src attribute/prop
 */
function getMediaSrcFromRS(rs) {
    // return rs;
    return new Response(rs).blob().then(function (blob) { return URL.createObjectURL(blob); });
}
/**
 * Reads a stream to completion and returns the underlying text
 * @param rs a readable stream of decrypted bytes
 * @returns the decrypted text
 */
function getTextFromRS(rs) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Response(rs).text()];
        });
    });
}
function downloadEncryptedFile(url, key, iv, authTag, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var fileFromUrlRegex, fileName, rs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fileFromUrlRegex = /(?!.*\/).+?(?=\.enc|\?|$)/;
                    fileName = options.fileName || (url.match(fileFromUrlRegex) || [])[0] || 'download';
                    return [4 /*yield*/, fetchAndDecipher(url, key, iv, authTag)];
                case 1:
                    rs = _a.sent();
                    // Stream the file to disk
                    return [2 /*return*/, saveFile(rs, fileName)];
            }
        });
    });
}
exports.downloadEncryptedFile = downloadEncryptedFile;
/**
 * Download, decrypt, and return string, object URL, or Blob to display directly on the webpage
 * @param url the URL to fetch an encrypted file from
 * @param key the decryption key to use for this encrypted file, as a Buffer or base64-encoded string
 * @param iv the initialization vector for this encrypted file, as a Buffer or base64-encoded string
 * @param authTag the authentication tag for this encrypted file, as a Buffer or base64-encoded string
 * @param mime the mime type of the underlying file
 * @returns depending on mime type, a string of text, or an src if it's media
 */
function getDecryptedContent(url, key, iv, authTag, mime) {
    return __awaiter(this, void 0, void 0, function () {
        var type, rs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    type = mime.split('/')[0];
                    return [4 /*yield*/, fetchAndDecipher(url, key, iv, authTag)];
                case 1:
                    rs = _a.sent();
                    // Return the decrypted content
                    if (type === 'image' || type === 'video' || type === 'audio')
                        return [2 /*return*/, getMediaSrcFromRS(rs)];
                    if (type === 'text' || mime === 'application/json')
                        return [2 /*return*/, getTextFromRS(rs)];
                    return [2 /*return*/, new Response(rs).blob()];
            }
        });
    });
}
exports.getDecryptedContent = getDecryptedContent;
