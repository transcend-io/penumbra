import {
  EncryptionCompletionEmit,
  EventForwarder,
  ProgressEmit,
} from '../types';

let initialized = false;
const eventQueue: ProgressEmit[] = [];
const onPenumbraEvent: EventForwarder = {};

self.addEventListener(
  'penumbra-progress',
  async (progressEvent: ProgressEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!initialized) {
        await Promise.all(eventQueue.map(async (event) => handler(event)));
        eventQueue.length = 0;
        initialized = true;
      }
      await handler(progressEvent);
    } else {
      // Buffer events occurring prior to initialization for re-dispatch
      eventQueue.push(progressEvent);
    }
  },
);

self.addEventListener(
  'penumbra-encryption-complete',
  async (completionEvent: EncryptionCompletionEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!initialized) {
        await Promise.all(eventQueue.map(async (event) => handler(event)));
        eventQueue.length = 0;
        initialized = true;
      }
      await handler(progressEvent);
    } else {
      // Buffer events occurring prior to initialization for re-dispatch
      eventQueue.push(progressEvent);
    }
  },
);

export default onPenumbraEvent;
