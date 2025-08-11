import type {
  JobCompletionEmit,
  EventForwarder,
  PenumbraErrorEmit,
  ProgressEmit,
} from '../types.js';

const progressEventQueue: ProgressEmit[] = [];
let progressEventQueueInit = false;
const jobCompletionEventQueue: JobCompletionEmit[] = [];
let jobCompletionEventQueueInit = false;
const penumbraErrorEventQueue: PenumbraErrorEmit[] = [];
let penumbraErrorEventQueueInit = false;
const errorEventQueue: ErrorEvent[] = [];
let errorEventQueueInit = false;

const onPenumbraEvent: EventForwarder = {};

self.addEventListener('penumbra-progress', (progressEvent: ProgressEmit) => {
  const { handler } = onPenumbraEvent;
  if (handler) {
    if (!progressEventQueueInit) {
      progressEventQueue.map((event) => {
        handler(event);
      });
      progressEventQueue.length = 0;
      progressEventQueueInit = true;
    }
    handler(progressEvent);
  } else {
    // Buffer events occurring prior to initialization for re-dispatch
    progressEventQueue.push(progressEvent);
  }
});

self.addEventListener(
  'penumbra-complete',
  (completionEvent: JobCompletionEmit) => {
    const { handler } = onPenumbraEvent;
    if (handler) {
      if (!jobCompletionEventQueueInit) {
        jobCompletionEventQueue.map((event) => {
          handler(event);
        });
        jobCompletionEventQueue.length = 0;
        jobCompletionEventQueueInit = true;
      }
      handler(completionEvent);
    } else {
      // Buffer events occurring prior to initialization for re-dispatch
      jobCompletionEventQueue.push(completionEvent);
    }
  },
);

self.addEventListener('penumbra-error', (errorEvent: PenumbraErrorEmit) => {
  const { handler } = onPenumbraEvent;
  if (handler) {
    if (!penumbraErrorEventQueueInit) {
      penumbraErrorEventQueue.map((event) => {
        handler(event);
      });
      penumbraErrorEventQueue.length = 0;
      penumbraErrorEventQueueInit = true;
    }
    handler(errorEvent);
  } else {
    // Buffer events occurring prior to initialization for re-dispatch
    penumbraErrorEventQueue.push(errorEvent);
  }
});

self.addEventListener('error', (errorEvent: ErrorEvent) => {
  const { handler } = onPenumbraEvent;
  if (handler) {
    if (!errorEventQueueInit) {
      errorEventQueue.map((event) => {
        handler(event);
      });
      errorEventQueue.length = 0;
      errorEventQueueInit = true;
    }
    handler(errorEvent);
  } else {
    // Buffer events occurring prior to initialization for re-dispatch
    errorEventQueue.push(errorEvent);
  }
});

export default onPenumbraEvent;
