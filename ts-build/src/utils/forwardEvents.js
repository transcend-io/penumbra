"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const progressEventQueue = [];
let progressEventQueueInit = false;
const jobCompletionEventQueue = [];
let jobCompletionEventQueueInit = false;
const penumbraErrorEventQueue = [];
let penumbraErrorEventQueueInit = false;
const errorEventQueue = [];
let errorEventQueueInit = false;
const onPenumbraEvent = {};
self.addEventListener('penumbra-progress', async (progressEvent) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
        if (!progressEventQueueInit) {
            await Promise.all(progressEventQueue.map(async (event) => handler(event)));
            progressEventQueue.length = 0;
            progressEventQueueInit = true;
        }
        await handler(progressEvent);
    }
    else {
        // Buffer events occurring prior to initialization for re-dispatch
        progressEventQueue.push(progressEvent);
    }
});
self.addEventListener('penumbra-complete', async (completionEvent) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
        if (!jobCompletionEventQueueInit) {
            await Promise.all(jobCompletionEventQueue.map(async (event) => handler(event)));
            jobCompletionEventQueue.length = 0;
            jobCompletionEventQueueInit = true;
        }
        await handler(completionEvent);
    }
    else {
        // Buffer events occurring prior to initialization for re-dispatch
        jobCompletionEventQueue.push(completionEvent);
    }
});
self.addEventListener('penumbra-error', async (errorEvent) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
        if (!penumbraErrorEventQueueInit) {
            await Promise.all(penumbraErrorEventQueue.map(async (event) => handler(event)));
            penumbraErrorEventQueue.length = 0;
            penumbraErrorEventQueueInit = true;
        }
        await handler(errorEvent);
    }
    else {
        // Buffer events occurring prior to initialization for re-dispatch
        penumbraErrorEventQueue.push(errorEvent);
    }
});
self.addEventListener('error', async (errorEvent) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
        if (!errorEventQueueInit) {
            await Promise.all(errorEventQueue.map(async (event) => handler(event)));
            errorEventQueue.length = 0;
            errorEventQueueInit = true;
        }
        await handler(errorEvent);
    }
    else {
        // Buffer events occurring prior to initialization for re-dispatch
        errorEventQueue.push(errorEvent);
    }
});
exports.default = onPenumbraEvent;
//# sourceMappingURL=forwardEvents.js.map