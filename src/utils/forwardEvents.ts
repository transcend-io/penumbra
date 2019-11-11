import {
  EncryptionCompletionEmit,
  EventForwarder,
  PenumbraErrorEmit,
  ProgressEmit,
} from '../types';

const progressEventQueue: ProgressEmit[] = [];
let progressEventQueueInitalized = false;
const encryptionCompletionEventQueue: EncryptionCompletionEmit[] = [];
let encryptionCompletionEventQueueInitalized = false;
const penumbraErrorEventQueue: PenumbraErrorEmit[] = [];
let penumbraErrorEventQueueInitialized = false;
const errorEventQueue: ErrorEvent[] = [];
let errorEventQueueInitialized = false;

const onPenumbraEvent: EventForwarder = {};

self.addEventListener(
  'penumbra-progress',
  async (progressEvent: ProgressEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!progressEventQueueInitalized) {
        await Promise.all(
          progressEventQueue.map(async (event) => handler(event)),
        );
        progressEventQueue.length = 0;
        progressEventQueueInitalized = true;
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
      if (!encryptionCompletionEventQueueInitalized) {
        await Promise.all(
          encryptionCompletionEventQueue.map(async (event) => handler(event)),
        );
        encryptionCompletionEventQueue.length = 0;
        encryptionCompletionEventQueueInitalized = true;
      }
      await handler(completionEvent);
    } else {
      // Buffer events occurring prior to initialization for re-dispatch
      encryptionCompletionEventQueue.push(completionEvent);
    }
  },
);

self.addEventListener(
  'penumbra-error',
  async (errorEvent: PenumbraErrorEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!penumbraErrorEventQueueInitialized) {
        await Promise.all(
          penumbraErrorEventQueue.map(async (event) => handler(event)),
        );
        penumbraErrorEventQueue.length = 0;
        penumbraErrorEventQueueInitialized = true;
      }
      await handler(errorEvent);
    } else {
      // Buffer events occurring prior to initialization for re-dispatch
      penumbraErrorEventQueue.push(errorEvent);
    }
  },
);

self.addEventListener('error', async (errorEvent: ErrorEvent) => {
  const { handler } = onPenumbraEvent;
  if (handler) {
    if (!errorEventQueueInitialized) {
      await Promise.all(errorEventQueue.map(async (event) => handler(event)));
      errorEventQueue.length = 0;
      errorEventQueueInitialized = true;
    }
    await handler(errorEvent);
  } else {
    // Buffer events occurring prior to initialization for re-dispatch
    errorEventQueue.push(errorEvent);
  }
});

export default onPenumbraEvent;
