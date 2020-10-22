"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// local
const fetchAndDecrypt_1 = __importDefault(require("./fetchAndDecrypt"));
const utils_1 = require("./utils");
/** No-op function generator */
// tslint:disable-next-line: no-empty, no-empty-function
const nooper = () => () => {
    /**
     * Appeasing tslint with an unnecessary comment
     *
     * @example const noop = nooper(); noop();
     * Expected results: None
     */
};
/**
 * A helper function that creates a set resource hints
 *
 * @param urls - The urls to add the resource hint to
 * @returns A function removing the resource hints
 */
function createResourceHintHelper(urls, rel) {
    if (self.document) {
        const links = urls.map((href) => {
            const link = document.createElement('link');
            link.rel = rel;
            link.href = href;
            document.head.appendChild(link);
            return link;
        });
        return () => links.map((link) => link.remove());
    }
    return nooper();
}
exports.createResourceHintHelper = createResourceHintHelper;
/**
 * Initialize and open connections to origins that
 * will soon be requested to speed up connection setup.
 * This should speed up HTTP/2 connections, but not HTTP/1.1.
 *
 * @param origins - Origins of the files to pre-connect to
 * @returns A function removing the links that were appended to the DOM
 */
function preconnect(...resources) {
    // preconnect to the origins
    const origins = utils_1.getOrigins(...resources.map(({ url }) => url));
    return createResourceHintHelper(origins, 'preconnect');
}
exports.preconnect = preconnect;
/**
 * Connect to and start loading URLs before they are needed.
 *
 * @param urls - The URLs to preload
 * @returns A function that removes the link tags that were appended to the DOM
 */
function preload(...resources) {
    return createResourceHintHelper(resources.map(({ url }) => url), 'preload');
}
exports.preload = preload;
/**
 * Fetch multiple resources to be zipped. Returns a list of ReadableStreams for each fetch request.
 *
 * ```ts
 * fetchMany(...resources).then((results) => zipAll(results, resources))
 * ```
 *
 * @param resources - The remote files to download
 * @returns Readable streams of the decrypted files
 */
async function fetchMany(...resources) {
    const cleanup = preconnect(...resources);
    const results = await Promise.all(resources.map((resource) => fetchAndDecrypt_1.default(resource)));
    cleanup();
    return results;
}
exports.default = fetchMany;
//# sourceMappingURL=fetchMany.js.map