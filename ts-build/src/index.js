"use strict";
/**
 * Penumbra
 * Fetch and decrypt files in the browser using whatwg streams and web workers.
 *
 * @module penumbra
 * @author Transcend Inc. <https://transcend.io>
 * @license Apache 2.0
 */
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const into_stream_1 = __importDefault(require("into-stream"));
// exports
const API_1 = __importDefault(require("./API"));
exports.penumbra = API_1.default;
const mock_1 = __importDefault(require("./mock"));
exports.MOCK_API = mock_1.default;
require("./transferHandlers/penumbra-events");
const types_1 = require("./types");
exports.PenumbraSupportLevel = types_1.PenumbraSupportLevel;
const event_1 = require("./event");
__export(require("./types"));
self.intoStream = into_stream_1.default;
self.penumbra = API_1.default;
if (self.dispatchEvent && event_1.PenumbraEvent) {
    self.dispatchEvent(new event_1.PenumbraEvent('penumbra-ready', { detail: { penumbra: API_1.default } }));
}
//# sourceMappingURL=index.js.map