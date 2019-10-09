import {
  EncryptionCompletionEmit,
  EventForwarder,
  ProgressEmit,
} from '../types';

let initialized = false;
const progressEventQueue: ProgressEmit[] = [];
const encryptionCompletionEventQueue: EncryptionCompletionEmit[] = [];

const onPenumbraEvent: EventForwarder = {};

self.addEventListener(
  'penumbra-progress',
  async (progressEvent: ProgressEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!initialized) {
        await Promise.all(
          progressEventQueue.map(async (event) => handler(event)),
        );
        progressEventQueue.length = 0;
        initialized = true;
      }
      await handler(progressEvent);
    } else {
      // Buffer events occurring prior to initialization for re-dispatch
      progressEventQueue.push(progressEvent);
    }
  },
);

self.addEventListener(
  'penumbra-encryption-complete',
  async (completionEvent: EncryptionCompletionEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!initialized) {
        await Promise.all(
          encryptionCompletionEventQueue.map(async (event) => handler(event)),
        );
        encryptionCompletionEventQueue.length = 0;
        initialized = true;
      }
      await handler(completionEvent);
    } else {
      // Buffer events occurring prior to initialization for re-dispatch
      encryptionCompletionEventQueue.push(completionEvent);
    }
  },
);

export default onPenumbraEvent;
