"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tape_1 = __importDefault(require("tape"));
const fetchAndDecrypt_1 = __importDefault(require("../fetchAndDecrypt"));
const helpers_1 = require("./helpers");
tape_1.default('fetchAndDecrypt', async (t) => {
    const resource = await fetchAndDecrypt_1.default({
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        filePrefix: 'NYT',
        mimetype: 'text/plain',
        decryptionOptions: {
            key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
            iv: '6lNU+2vxJw6SFgse',
            authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
    });
    const sha256 = await helpers_1.hash('SHA-256', await new Response(resource).arrayBuffer());
    t.equals(sha256, '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5');
    t.end();
});
//# sourceMappingURL=fetchAndDecrypt.test.js.map