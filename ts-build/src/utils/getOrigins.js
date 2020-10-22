"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ORIGIN_MATCHER = /^[\w-]+:\/{2,}\[?[\w.:-]+\]?(?::[0-9]*)?/;
/**
 * Gets the origin from a URL
 *
 * @memberof module:utils
 *
 * @param url - The URL to extract an origin from
 * @returns The origin of the URL
 */
function extractOrigin(url) {
    const origin = url.match(ORIGIN_MATCHER);
    if (!origin) {
        throw new Error('No origin found. Possibly invalid URL');
    }
    return origin[0];
}
exports.extractOrigin = extractOrigin;
/**
 * Gets the unique set of origins from a list of URLs
 *
 * @memberof module:utils
 *
 * @param urls - The list of urls to extract the origins from
 * @returns The unique set of origins for this URLs
 */
function getOrigins(...urls) {
    return [...new Set(urls.map(extractOrigin))];
}
exports.default = getOrigins;
//# sourceMappingURL=getOrigins.js.map