"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
let supportLevel = types_1.PenumbraSupportLevel.none;
// Event/CustomEvent is non-instantiable, among many various other incompatibilities in IE11
if (self.dispatchEvent &&
    typeof self.CustomEvent === 'function' &&
    typeof self.Proxy === 'function' &&
    typeof self.Promise === 'function' &&
    typeof self.Response === 'function' &&
    typeof self.fetch === 'function') {
    supportLevel =
        'WritableStream' in self && 'TransformStream' in self
            ? types_1.PenumbraSupportLevel.full
            : types_1.PenumbraSupportLevel.size_limited;
}
/** Get Penumbra user agent support level */
function supported() {
    return supportLevel;
}
exports.supported = supported;
supported.levels = types_1.PenumbraSupportLevel;
//# sourceMappingURL=ua-support.js.map