"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const into_stream_1 = __importDefault(require("into-stream"));
/** Converts arrays into streams and passes  */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const intoStreamOnlyOnce = (input) => 
// eslint-disable-next-line no-underscore-dangle
input && (input instanceof ReadableStream || input._read)
    ? input
    : into_stream_1.default(input);
exports.default = intoStreamOnlyOnce;
//# sourceMappingURL=intoStreamOnlyOnce.js.map