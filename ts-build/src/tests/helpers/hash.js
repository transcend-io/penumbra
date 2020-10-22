"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Get the cryptographic hash of an ArrayBuffer
 *
 * @param ab - ArrayBuffer to digest
 * @param algorithm - Cryptographic hash digest algorithm
 * @returns Hexadecimal hash digest string
 */
async function hash(algorithm, ab) {
    const digest = new Uint8Array(await crypto.subtle.digest(algorithm, await ab));
    return digest.reduce((memo, i) => memo + i.toString(16).padStart(2, '0'), '');
}
exports.default = hash;
//# sourceMappingURL=hash.js.map