"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Set and manage a timeout
 *
 * @param callback - Timeout callback
 * @param delay - Time in seconds to wait before calling the callback
 * @returns Timeout cancellation helper
 */
function timeout(
// tslint:disable-next-line: ban-types
callback, delay) {
    const timer = self.setTimeout(callback, delay * 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clear = self.clearTimeout.bind(self, timer);
    return { clear };
}
exports.default = timeout;
//# sourceMappingURL=timeout.js.map