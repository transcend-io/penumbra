import { ProgressEmit, ProgressForwarder } from '../types';

let initialized = false;
const eventQueue: ProgressEmit[] = [];
const onProgress: ProgressForwarder = {};

// eslint-disable-next-line no-restricted-globals
self.addEventListener(
  'penumbra-progress',
  async (progressEvent: ProgressEmit) => {
    const { handler } = onProgress;
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

export default onProgress;
