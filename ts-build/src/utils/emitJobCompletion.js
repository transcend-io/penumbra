"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// penumbra
const event_1 = require("../event");
/**
 * An event emitter for job completion
 * @param id - Job ID
 * @param decryptionInfo - PenumbraDecryptionInfo
 */
function emitJobCompletion(id, decryptionInfo) {
    const emitContent = {
        detail: { id, decryptionInfo },
    };
    // Dispatch the event
    const event = new event_1.PenumbraEvent('penumbra-complete', emitContent);
    self.dispatchEvent(event);
}
exports.default = emitJobCompletion;
//# sourceMappingURL=emitJobCompletion.js.map