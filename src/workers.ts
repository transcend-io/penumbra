/* eslint-disable no-plusplus */

// comlink
import { proxy, wrap } from 'comlink';

// local
import {
  PenumbraWorker,
  PenumbraWorkerAPI,
  WorkerLocation,
  WorkerLocationOptions,
  ProgressEmit,
} from './types';
import { advancedStreamsSupported } from './ua-support';
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

const SHOULD_LOG_EVENTS =
  typeof process !== 'undefined' && process.env.PENUMBRA_LOG_START === 'true';

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

// //////////// //
// Load Workers //
// //////////// //

if (SHOULD_LOG_EVENTS) {
  logger.info('Loading penumbra script element...');
}
let scriptElement: HTMLScriptElement = (document.currentScript ||
  document.querySelector('script[data-penumbra]')) as HTMLScriptElement;
if (!scriptElement) {
  scriptElement = { dataset: {} } as HTMLScriptElement;
  if (SHOULD_LOG_EVENTS) {
    logger.info('Unable to locate Penumbra script element.');
  }
}

/**
 * Get the script throwing error if cannot be found
 */
const scriptUrl = new URL(scriptElement.src, location.href);

/** For resolving URLs */
const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

/**
 * Resolve a potentially relative URL into an absolute URL
 *
 * @param url - URL
 * @returns Url resolved
 */
function resolve(url: string): URL {
  resolver.href = url;
  return new URL(resolver.href, scriptUrl);
}

// /////// //
// Methods //
// /////// //

/**
 * Gets worker location configuration
 *
 * @returns Worker location
 */
export function getWorkerLocation(): WorkerLocation {
  const config = JSON.parse(settings.workers || '{}');
  const options = {
    ...DEFAULT_WORKERS,
    /* Support either worker="penumbra-worker" (non-JSON)
     *             or workers='"{"penumbra": "...", "StreamSaver": "..."}"' */
    penumbra: settings.worker || DEFAULT_WORKERS.penumbra,
    ...(typeof config === 'object' ? config : {}),
  };
  const { base, penumbra, StreamSaver } = options;

  const context = resolve(base || scriptUrl);

  return {
    base: context,
    penumbra: new URL(penumbra, context),
    StreamSaver: new URL(StreamSaver, context),
  };
}

/**
 * Re-dispatch events
 *
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
 *
 * @param url - URL
 * @returns Worker
 */
export async function createPenumbraWorker(
  url: URL | string,
): Promise<PenumbraWorker> {
  const id = workerID++;
  const worker = new Worker(url, {
    // type: 'module', // waiting on Firefox
    name: `penumbra-worker-${id}`,
  });
  const penumbraWorker: PenumbraWorker = {
    worker,
    id,
    comlink: wrap(worker),
    busy: false,
  };
  const Link = penumbraWorker.comlink;
  const setup = new Link().then(async (thread: PenumbraWorkerAPI) => {
    await thread.setup(id, proxy(reDispatchEvent));
  });
  await setup;
  return penumbraWorker;
}

const onWorkerInitQueue: (() => void)[] = [];

/**
 * Get any free worker thread
 *
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
 *
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
export async function initWorkers(): Promise<void> {
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
 *
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
 *
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
 *   base: '/penumbra-workers/',
 *   penumbra: 'worker.penumbra.js',
 *   StreamSaver: 'StreamSaver.js',
 * });
 * // Set a single worker's location
 * penumbra.setWorkerLocation({decrypt: 'penumbra.decrypt.js'});
 * ```
 *
 * @param options - Worker location options
 */
export async function setWorkerLocation(
  options: WorkerLocationOptions | string,
): Promise<void> {
  // Workers require WritableStream & TransformStream
  if (!advancedStreamsSupported) {
    return;
  }
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
 *
 * @param options - Options
 */
const trackWorkerBusyState = ({
  detail: { worker, totalBytesRead, contentLength },
}: ProgressEmit): void => {
  if (typeof worker === 'number' && totalBytesRead >= contentLength) {
    workers[worker].busy = false;
  }
};

addEventListener('penumbra-progress', trackWorkerBusyState);
/* eslint-enable no-plusplus */
