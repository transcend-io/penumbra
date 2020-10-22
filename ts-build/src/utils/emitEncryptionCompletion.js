"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// penumbra
const event_1 = require("../event");
/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param url the URL being read from
 * @returns
 */
function emitEncryptionCompletion(id, decryptionInfo) {
    const emitContent = {
        detail: { id, decryptionInfo },
    };
    // Dispatch the event
    const event = new event_1.PenumbraEvent('penumbra-complete', emitContent);
    self.dispatchEvent(event);
}
exports.default = emitEncryptionCompletion;
//# sourceMappingURL=emitEncryptionCompletion.js.map