"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// local
const fetchAndDecrypt_1 = __importDefault(require("./fetchAndDecrypt"));
const utils_1 = require("./utils");
const MEDIA_TYPES = ['image', 'video', 'audio'];
const TEXT_TYPES = /^\s*(?:text\/\S*|application\/(?:xml|json)|\S*\/\S*\+xml|\S*\/\S*\+json)\s*(?:$|;)/i;
/**
 * Get the contents of an encrypted file
 *
 * @param options - FetchDecryptedContentOptions
 * @returns The file contents
 */
async function getDecryptedContent(resource, alwaysResponse = false) {
    // Fetch the resource
    const rs = await fetchAndDecrypt_1.default(resource);
    // Return the decrypted content
    const type = resource.mimetype
        .split('/')[0]
        .trim()
        .toLowerCase();
    if (!alwaysResponse) {
        if (MEDIA_TYPES.includes(type)) {
            return utils_1.getMediaSrcFromRS(rs);
        }
        if (type === 'text' || TEXT_TYPES.test(resource.mimetype)) {
            return utils_1.getTextFromRS(rs);
        }
    }
    // Always return a response
    return new Response(rs);
}
exports.default = getDecryptedContent;
//# sourceMappingURL=getDecryptedContent.js.map