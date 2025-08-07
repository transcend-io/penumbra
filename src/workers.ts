// comlink
import { proxy, wrap } from 'comlink';

// local
import type { PenumbraWorker, PenumbraWorkerAPI, ProgressEmit } from './types';
import { settings } from './settings';

// //// //
// Init //
// //// //

// Save self to view
const view = self;

// Ensure rendering in DOM
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!view.document) {
  throw new Error(
    'Penumbra must be included in a document as an unbundled script element.',
  );
}

/** Whether or not Penumbra has been initialized */
let initialized = false;
/** Whether or not Penumbra is currently initializing workers */
let initializing = false;

// /////// //
// Methods //
// /////// //

/**
 * Re-dispatch events
 * @param event - Event
 */
function reDispatchEvent(event: Event): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (view.dispatchEvent) {
    view.dispatchEvent(event);
  }
}

// Set data-worker-limit to limit the maximum number of Penumbra workers
const WORKER_LIMIT = +(settings.workerLimit ?? 16);
const { hardwareConcurrency } = navigator;
// Get available processor threads
const availConcurrency = hardwareConcurrency
  ? // Reserve one thread (if hwConcurrency is supported) for UI renderer to prevent jank
    hardwareConcurrency - 1
  : 4;
const maxConcurrency = Math.min(availConcurrency, WORKER_LIMIT);
const workers: PenumbraWorker[] = [];
let workerID = 0;

/**
 * Instantiate a Penumbra Worker
 * @param url - URL
 * @returns Worker
 */
async function createPenumbraWorker(): Promise<PenumbraWorker> {
  const worker = new Worker(new URL('worker.penumbra.js', import.meta.url), {
    type: 'module',
  });
  const id = workerID++;
  const penumbraWorker: PenumbraWorker = {
    worker,
    id,

    comlink: wrap<new () => PenumbraWorkerAPI>(worker),
    busy: false,
  };
  const RemoteAPI = penumbraWorker.comlink;
  const remote = await new RemoteAPI();
  await remote.setup(id, proxy(reDispatchEvent));
  return penumbraWorker;
}

const onWorkerInitQueue: (() => void)[] = [];

/**
 * Get any free worker thread
 * @returns Worker
 */
function getFreeWorker(): PenumbraWorker {
  // Poll for any available free workers
  const freeWorker = workers.find(({ busy }) => !busy);

  // return any free worker or a random one if all are busy
  const worker =
    freeWorker ?? workers[Math.floor(Math.random() * workers.length)];

  // Set worker as busy
  worker.busy = true;

  return worker;
}

/**
 * Wait for workers to initialize
 * @returns Worker
 */
function waitForInit(): Promise<PenumbraWorker> {
  return new Promise((resolveWorker) => {
    onWorkerInitQueue.push(() => {
      resolveWorker(getFreeWorker());
    });
  });
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const call = Function.prototype.call.bind(Function.prototype.call);

/** Initializes web worker threads */
async function initWorkers(): Promise<void> {
  initializing = true;
  workers.push(
    ...(await Promise.all(
      // load all workers in parallel
      Array.from({ length: Math.max(maxConcurrency - workers.length, 0) })
        .fill(0) // incorrect built-in types prevent .fill()
        .map(() => createPenumbraWorker()),
    )),
  );
  initializing = false;
  initialized = true;
  // Dispatch worker init ready queue
  for (const element of onWorkerInitQueue) {
    call(element);
  }
  onWorkerInitQueue.length = 0;
}

/**
 * Get and initialize the Penumbra Worker thread
 * @returns The list of active worker threads
 */
export async function getWorker(): Promise<PenumbraWorker> {
  if (initializing) {
    return waitForInit();
  }
  if (!initialized) {
    await initWorkers();
  }
  return getFreeWorker();
}

/**
 * Returns all active Penumbra Workers
 * @returns Workers
 */
function getActiveWorkers(): PenumbraWorker[] {
  return workers;
}

/**
 * Terminate Penumbra worker and de-allocate their resources
 */
function cleanup(): void {
  for (const thread of getActiveWorkers()) {
    thread.worker.terminate();
  }
  workers.length = 0;
  workerID = 0;
}

view.addEventListener('beforeunload', cleanup);

/**
 * Set worker busy state based on current progress events
 * @param options - Options
 */
const trackWorkerBusyState = ({
  detail: { worker, totalBytesRead, contentLength },
}: ProgressEmit): void => {
  if (
    typeof worker === 'number' &&
    // TODO: Switch to a more robust check whether we're streaming which doesn't require contentLength being known
    contentLength !== null &&
    totalBytesRead >= contentLength
  ) {
    workers[worker].busy = false;
  }
};

addEventListener('penumbra-progress', trackWorkerBusyState);
