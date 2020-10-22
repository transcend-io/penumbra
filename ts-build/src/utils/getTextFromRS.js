"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Reads a stream to completion and returns the underlying text
 *
 * @param rs - A readable stream of decrypted bytes
 * @returns The decrypted text
 */
function getTextFromRS(rs) {
    return new Response(rs).text();
}
exports.default = getTextFromRS;
//# sourceMappingURL=getTextFromRS.js.map