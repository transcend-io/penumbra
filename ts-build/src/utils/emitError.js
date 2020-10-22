"use strict";
/* eslint-disable no-restricted-syntax */
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("../error");
const event_1 = require("../event");
/**
 * An event emitter for errors and exceptions
 *
 * @param error Error object to emit
 * @param downloadUrl The URL throwing error
 * @returns
 */
function emitError(error) {
    const detail = error instanceof error_1.PenumbraError ? error : new error_1.PenumbraError(error, 'NA');
    const emitContent = { detail };
    // Dispatch the event
    const event = new event_1.PenumbraEvent('penumbra-error', emitContent);
    self.dispatchEvent(event);
}
exports.default = emitError;
//# sourceMappingURL=emitError.js.map