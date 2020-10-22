"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_1 = require("../event");
/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param id the unique job ID # or URL being read from
 * @returns
 */
function emitProgress(type, totalBytesRead, contentLength, id) {
    // Calculate the progress remaining
    const percent = Math.round((totalBytesRead / contentLength) * 100);
    const emitContent = {
        detail: {
            type,
            percent,
            totalBytesRead,
            contentLength,
            id,
        },
    };
    // Dispatch the event
    const event = new event_1.PenumbraEvent('penumbra-progress', emitContent);
    self.dispatchEvent(event);
}
exports.default = emitProgress;
//# sourceMappingURL=emitProgress.js.map