"use strict";
/* eslint-disable require-jsdoc, @typescript-eslint/no-empty-function, no-empty */
/* tslint-disable no-empty */
Object.defineProperty(exports, "__esModule", { value: true });
// local
const types_1 = require("./types");
const supported = () => -0;
supported.levels = types_1.PenumbraSupportLevel;
const MOCK_API = {
    get: async () => [],
    save: () => new AbortController(),
    supported,
    encrypt: async () => [],
    decrypt: async () => [],
    getDecryptionInfo: async () => ({
        key: 'test',
        iv: 'test',
        authTag: 'test',
    }),
    getBlob: async () => new Blob(),
    getTextOrURI: () => [
        Promise.resolve({ data: 'test', type: 'text', mimetype: 'text/plain' }),
    ],
    saveZip: () => ({
        /** Add PenumbraFiles to zip */
        write() { },
        /** Close zip writer */
        close() { },
        conflux: function Writer() { },
        writer: {},
        controller: new AbortController(),
        aborted: false,
    }),
    setWorkerLocation: async () => undefined,
};
exports.default = MOCK_API;
/* tslint-enable no-empty */
/* eslint-enable require-jsdoc, @typescript-eslint/no-empty-function, no-empty */
//# sourceMappingURL=mock.js.map