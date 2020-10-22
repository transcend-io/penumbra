"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tape_1 = __importDefault(require("tape"));
const fetchMany_1 = require("../fetchMany");
tape_1.default('preconnect', async (t) => {
    const measurePreconnects = () => document.querySelectorAll('link[rel="preconnect"]').length;
    const start = measurePreconnects();
    const cleanup = fetchMany_1.preconnect({
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        filePrefix: 'NYT',
        mimetype: 'text/plain',
        decryptionOptions: {
            key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
            iv: '6lNU+2vxJw6SFgse',
            authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
    });
    const after = measurePreconnects();
    cleanup();
    t.assert(start < after);
    t.end();
});
tape_1.default('preload', async (t) => {
    const measurePreloads = () => document.querySelectorAll('link[rel="preload"]').length;
    const start = measurePreloads();
    const cleanup = fetchMany_1.preload({
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        filePrefix: 'NYT',
        mimetype: 'text/plain',
        decryptionOptions: {
            key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
            iv: '6lNU+2vxJw6SFgse',
            authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
    });
    const after = measurePreloads();
    cleanup();
    t.assert(start < after);
    t.end();
});
//# sourceMappingURL=resourceHints.test.js.map