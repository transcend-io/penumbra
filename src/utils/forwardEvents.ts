import {
  JobCompletionEmit,
  EventForwarder,
  PenumbraErrorEmit,
  ProgressEmit,
} from '../types';

const progressEventQueue: ProgressEmit[] = [];
let progressEventQueueInit = false;
const jobCompletionEventQueue: JobCompletionEmit[] = [];
let jobCompletionEventQueueInit = false;
const penumbraErrorEventQueue: PenumbraErrorEmit[] = [];
let penumbraErrorEventQueueInit = false;
const errorEventQueue: ErrorEvent[] = [];
let errorEventQueueInit = false;

const onPenumbraEvent: EventForwarder = {};

self.addEventListener(
  'penumbra-progress',
  async (progressEvent: ProgressEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!progressEventQueueInit) {
        await Promise.all(progressEventQueue.map((event) => handler(event)));
        progressEventQueue.length = 0;
        progressEventQueueInit = true;
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
      if (!jobCompletionEventQueueInit) {
        await Promise.all(
          jobCompletionEventQueue.map((event) => handler(event)),
        );
        jobCompletionEventQueue.length = 0;
        jobCompletionEventQueueInit = true;
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
      if (!penumbraErrorEventQueueInit) {
        await Promise.all(
          penumbraErrorEventQueue.map((event) => handler(event)),
        );
        penumbraErrorEventQueue.length = 0;
        penumbraErrorEventQueueInit = true;
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
    if (!errorEventQueueInit) {
      await Promise.all(errorEventQueue.map((event) => handler(event)));
      errorEventQueue.length = 0;
      errorEventQueueInit = true;
    }
    await handler(errorEvent);
  } else {
    // Buffer events occurring prior to initialization for re-dispatch
    errorEventQueue.push(errorEvent);
  }
});

export default onPenumbraEvent;
