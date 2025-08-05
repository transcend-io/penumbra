/* eslint-disable no-plusplus */

// comlink
import { proxy, wrap } from 'comlink';

// local
import type {
  PenumbraWorker,
  PenumbraWorkerAPI,
  WorkerLocation,
  WorkerLocationOptions,
  ProgressEmit,
} from './types';
import { logger } from './logger';
import { settings } from './settings';

// ////// //
// Config //
// ////// //

/**
 * The default worker file locations
 */
const DEFAULT_WORKERS = {
  penumbra: 'worker.penumbra.js',
  StreamSaver: 'streamsaver.penumbra.serviceworker.js',
};

// //// //
// Init //
// //// //

// Save self to view
const view = self;

// Ensure rendering in DOM
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
 * Gets worker location configuration
 * @returns Worker location
 */
function getWorkerLocation(): WorkerLocation {
  return {
    penumbra: new URL(DEFAULT_WORKERS.penumbra, import.meta.url),
    StreamSaver: new URL(DEFAULT_WORKERS.StreamSaver, import.meta.url),
  };
}

/**
 * Re-dispatch events
 * @param event - Event
 */
function reDispatchEvent(event: Event): void {
  if (view.dispatchEvent) {
    view.dispatchEvent(event);
  }
}

// Set data-worker-limit to limit the maximum number of Penumbra workers
const WORKER_LIMIT = +(settings.workerLimit || 16);
const { hardwareConcurrency } = navigator;
// Get available processor threads
const availConcurrency = hardwareConcurrency
  ? // Reserve one thread (if hwConcurrency is supported) for UI renderer to prevent jank
    hardwareConcurrency - 1
  : 4;
const maxConcurrency =
  availConcurrency > WORKER_LIMIT ? WORKER_LIMIT : availConcurrency;
const workers: PenumbraWorker[] = [];
let workerID = 0;

/**
 * Instantiate a Penumbra Worker
 * @param url - URL
 * @returns Worker
 */
async function createPenumbraWorker(
  url: URL | string,
): Promise<PenumbraWorker> {
  const worker = new Worker(url, { type: 'module' });
  const id = workerID++;
  const penumbraWorker: PenumbraWorker = {
    worker,
    id,
    // eslint-disable-next-line no-spaced-func, func-call-spacing
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
    freeWorker || workers[Math.floor(Math.random() * workers.length)];

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

const call = Function.prototype.call.bind(Function.prototype.call);

/** Initializes web worker threads */
async function initWorkers(): Promise<void> {
  initializing = true;
  const { penumbra } = getWorkerLocation();
  workers.push(
    ...(await Promise.all(
      // load all workers in parallel
      new Array(Math.max(maxConcurrency - workers.length, 0))
        .fill(0) // incorrect built-in types prevent .fill()
        .map(() => createPenumbraWorker(penumbra)),
    )),
  );
  initializing = false;
  initialized = true;
  // Dispatch worker init ready queue
  onWorkerInitQueue.forEach(call);
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
  getActiveWorkers().forEach((thread) => {
    thread.worker.terminate();
  });
  workers.length = 0;
  workerID = 0;
}

view.addEventListener('beforeunload', cleanup);

/**
 * Configure the location of Penumbra's worker threads
 *
 *
 * ```ts
 * // Set only the Penumbra Worker URL by passing a string. Base URL is derived from this
 * penumbra.setWorkerLocation('/penumbra-workers/worker.penumbra.js')
 * // Set all worker URLs by passing a WorkerLocation object
 * penumbra.setWorkerLocation({
 * base: '/penumbra-workers/',
 * penumbra: 'worker.penumbra.js',
 * StreamSaver: 'StreamSaver.js',
 * });
 * // Set a single worker's location
 * penumbra.setWorkerLocation({decrypt: 'penumbra.decrypt.js'});
 * ```
 * @param options - Worker location options
 */
export async function setWorkerLocation(
  options: WorkerLocationOptions | string,
): Promise<void> {
  if (initialized) {
    logger.warn('Penumbra Workers are already active. Reinitializing...');
    await cleanup();
    return;
  }
  settings.workers = JSON.stringify(
    typeof options === 'string'
      ? { ...DEFAULT_WORKERS, base: options, penumbra: options }
      : { ...DEFAULT_WORKERS, ...options },
  );
  await initWorkers();
}

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
/* eslint-enable no-plusplus */
