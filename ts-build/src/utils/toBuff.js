"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Convert to buffer
 *
 * @param i - The input buffer or string
 * @returns Enforced as buffer
 */
exports.default = (i) => typeof i === 'string' ? Buffer.from(i, 'base64') : i;
//# sourceMappingURL=toBuff.js.map