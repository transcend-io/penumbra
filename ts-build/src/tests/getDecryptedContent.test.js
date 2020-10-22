"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tape_1 = __importDefault(require("tape"));
const getDecryptedContent_1 = __importDefault(require("../getDecryptedContent"));
const helpers_1 = require("./helpers");
tape_1.default('getDecryptedContent: text', async (t) => {
    const decryptedText = await getDecryptedContent_1.default({
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        filePrefix: 'NYT',
        mimetype: 'text/plain',
        decryptionOptions: {
            key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
            iv: '6lNU+2vxJw6SFgse',
            authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
    });
    if (typeof decryptedText !== 'string') {
        throw new Error('Decrypted text expected to be a string!');
    }
    t.equal(await helpers_1.hash('SHA-256', new TextEncoder().encode(decryptedText)), '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5');
    t.end();
});
tape_1.default('getDecryptedContent: unencrypted content', async (t) => {
    const text = await getDecryptedContent_1.default({
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt',
        filePrefix: 'NYT',
        mimetype: 'text/plain',
    });
    if (typeof text !== 'string') {
        throw new Error('Decrypted text expected to be a string!');
    }
    t.equal(await helpers_1.hash('SHA-256', new TextEncoder().encode(text)), '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5');
    t.end();
});
tape_1.default('getDecryptedContent: images (as Response)', async (t) => {
    const content = await getDecryptedContent_1.default({
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
        filePrefix: 'tortoise',
        mimetype: 'image/jpeg',
        decryptionOptions: {
            key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
            iv: '6lNU+2vxJw6SFgse',
            authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
        },
    }, true);
    if (typeof content === 'string') {
        throw new Error('Decrypted content expected to be a Response!');
    }
    const imageBytes = await content.arrayBuffer();
    t.equals(await helpers_1.hash('SHA-256', imageBytes), '1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95');
    t.end();
});
tape_1.default('getDecryptedContent: images (as URL)', async (t) => {
    const url = await getDecryptedContent_1.default({
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
        filePrefix: 'tortoise',
        mimetype: 'image/jpeg',
        decryptionOptions: {
            key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
            iv: '6lNU+2vxJw6SFgse',
            authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
        },
    });
    let isURL = true;
    if (typeof url !== 'string') {
        throw new Error('url expected to be a string!');
    }
    try {
        // tslint:disable-next-line: no-unused-expression
        new URL(url, location.href); // eslint-disable-line no-new
    }
    catch (ex) {
        isURL = false;
    }
    t.assert(isURL);
    const imageBytes = await fetch(url).then((r) => r.arrayBuffer());
    t.equals(await helpers_1.hash('SHA-256', imageBytes), '1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95');
    t.end();
});
tape_1.default('getDecryptedContent: Download Progress Event Emitter', async (t) => {
    const progressEventName = 'penumbra-progress';
    const fail = () => {
        t.fail();
        t.end();
    };
    const initTimeout = helpers_1.timeout(fail, 60);
    let stallTimeout;
    let initFinished = false;
    let progressStarted = false;
    let lastPercent;
    const onprogress = (evt) => {
        const { percent } = evt.detail;
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(percent)) {
            if (!initFinished) {
                initTimeout.clear();
                stallTimeout = helpers_1.timeout(fail, 10);
                initFinished = true;
                lastPercent = percent;
            }
            else if (!progressStarted) {
                if (percent > lastPercent) {
                    stallTimeout.clear();
                    progressStarted = true;
                }
            }
            if (progressStarted && evt.detail.percent > 25) {
                self.removeEventListener(progressEventName, onprogress);
                t.pass();
                t.end();
            }
        }
        lastPercent = percent;
    };
    self.addEventListener(progressEventName, onprogress);
    await getDecryptedContent_1.default({
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/k.webm.enc',
        filePrefix: 'k',
        mimetype: 'video/webm',
        decryptionOptions: {
            key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
            iv: '6lNU+2vxJw6SFgse',
            authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
        },
    });
});
//# sourceMappingURL=getDecryptedContent.test.js.map