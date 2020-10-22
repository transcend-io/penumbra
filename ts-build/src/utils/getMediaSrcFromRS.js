"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns an object URL to display media directly on a webpage
 *
 * @param rs - A readable stream of decrypted bytes
 * @returns The object URL to be added to an src attribute/prop
 */
function getMediaSrcFromRS(rs) {
    return new Response(rs).blob().then((blob) => URL.createObjectURL(blob));
}
exports.default = getMediaSrcFromRS;
//# sourceMappingURL=getMediaSrcFromRS.js.map