import {
  JobCompletionEmit,
  EventForwarder,
  PenumbraErrorEmit,
  ProgressEmit,
} from '../types';

const progressEventQueue: ProgressEmit[] = [];
let progressEventQueueInitalized = false;
const jobCompletionEventQueue: JobCompletionEmit[] = [];
let jobCompletionEventQueueInitalized = false;
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
  'penumbra-complete',
  async (completionEvent: JobCompletionEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!jobCompletionEventQueueInitalized) {
        await Promise.all(
          jobCompletionEventQueue.map(async (event) => handler(event)),
        );
        jobCompletionEventQueue.length = 0;
        jobCompletionEventQueueInitalized = true;
      }
      await handler(completionEvent);
    } else {
      // Buffer events occurring prior to initialization for re-dispatch
      jobCompletionEventQueue.push(completionEvent);
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
