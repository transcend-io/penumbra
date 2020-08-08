/* eslint-disable import/no-webpack-loader-syntax */

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

// ////// //
// Config //
// ////// //

/**
 * The default worker file locations
 */
const DEFAULT_WORKERS = {
  penumbra: 'penumbra.worker.js',
  StreamSaver: 'streamsaver.penumbra.serviceworker.js',
};

const SHOULD_LOG_EVENTS = process.env.PENUMBRA_LOG_START === 'true';

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

// //////////// //
// Load Workers //
// //////////// //

if (SHOULD_LOG_EVENTS) {
  console.info('Loading penumbra script element...');
}
let scriptElement: HTMLScriptElement = (document.currentScript ||
  document.querySelector('script[data-penumbra]')) as HTMLScriptElement;
if (!scriptElement) {
  scriptElement = { dataset: {} } as HTMLScriptElement;
  if (SHOULD_LOG_EVENTS) {
    console.info('Unable to locate Penumbra script element.');
  }
}

/**
 * Get the script throwing error if cannot be found
 */
const script = scriptElement.dataset;

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
 * @param options - A stream of bytes to be saved to disk
 */
export function getWorkerLocation(): WorkerLocation {
  const config = JSON.parse(script.workers || '{}');
  const options = {
    ...DEFAULT_WORKERS,
    /* Support either worker="penumbra-worker" (non-JSON)
     *             or workers='"{"penumbra": "...", "StreamSaver": "..."}"' */
    penumbra: script.worker || DEFAULT_WORKERS.penumbra,
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

/** Re-dispatch events */
function reDispatchEvent(event: Event): void {
  if (view.dispatchEvent) {
    view.dispatchEvent(event);
  }
}

const hwConcurrency = navigator.hardwareConcurrency || 1;
// Limit thread pool size to 8
const maxConcurrency = Math.min(hwConcurrency, 8);
const workers: PenumbraWorker[] = [];

/** Instantiate a Penumbra Worker */
export async function createPenumbraWorker(
  url: URL | string,
): Promise<PenumbraWorker> {
  const worker = new Worker(url /* , { type: 'module' } */);
  const id = workers.length;
  const penumbraWorker: PenumbraWorker = {
    worker,
    id,
    comlink: wrap(worker),
    initialized: false,
    busy: false,
  };
  const Link = penumbraWorker.comlink;
  const setup = new Link().then(async (thread: PenumbraWorkerAPI) => {
    await thread.setup(id, proxy(reDispatchEvent));
  });
  await setup;
  penumbraWorker.initialized = true;
  return penumbraWorker;
}
/** Initializes web worker threads */
export async function initWorkers(): Promise<void> {
  const { penumbra } = getWorkerLocation();
  if (!workers.length) {
    workers.push(
      ...(await Promise.all(
        new Array(maxConcurrency)
          .fill(0) // incorrect built-in types prevent .fill()
          .map(() => createPenumbraWorker(penumbra)),
      )),
    );
  }
  if (!initialized) {
    initialized = true;
  }
}

/**
 * Get and initialize the Penumbra Worker thread
 *
 * @returns The list of active worker threads
 */
export async function getWorker(): Promise<PenumbraWorker> {
  if (
    !workers.length ||
    (workers.length && !workers.some((worker) => worker.initialized))
  ) {
    await initWorkers();
  }
  // Poll for any available free workers
  const freeWorker = workers.find(({ busy }) => !busy);
  // return any free worker or a random one if all are busy
  return freeWorker || workers[Math.floor(Math.random() * workers.length)];
}

/** Returns all active Penumbra Workers */
function getActiveWorkers(): PenumbraWorker[] {
  return workers.filter((worker) => worker.initialized);
}

/**
 * Terminate Penumbra worker and de-allocate their resources
 */
function cleanup(): void {
  getActiveWorkers().forEach((thread) => {
    thread.worker.terminate();
    // eslint-disable-next-line no-param-reassign
    thread.initialized = false;
  });
  workers.length = 0;
}

view.addEventListener('beforeunload', cleanup);

/**
 * Configure the location of Penumbra's worker threads
 *
 * @param options - Worker location options
 *
 * ```ts
 * // Set only the Penumbra Worker URL by passing a string. Base URL is derived from this
 * penumbra.setWorkerLocation('/penumbra-workers/penumbra.worker.js')
 * // Set all worker URLs by passing a WorkerLocation object
 * penumbra.setWorkerLocation({
 *   base: '/penumbra-workers/',
 *   penumbra: 'penumbra.worker.js',
 *   StreamSaver: 'StreamSaver.js',
 * });
 * // Set a single worker's location
 * penumbra.setWorkerLocation({decrypt: 'penumbra.decrypt.js'});
 * ```
 */
export async function setWorkerLocation(
  options: WorkerLocationOptions | string,
): Promise<void> {
  if (initialized) {
    console.warn('Penumbra Workers are already active. Reinitializing...');
    await cleanup();
  }
  script.workers = JSON.stringify(
    typeof options === 'string'
      ? { ...DEFAULT_WORKERS, base: options, penumbra: options }
      : { ...DEFAULT_WORKERS, ...options },
  );
  return initWorkers();
}

/** Set worker busy state based on current progress events */
const trackWorkerBusyState = ({
  detail: { worker, totalBytesRead, contentLength },
}: ProgressEmit): void => {
  if (worker !== null) {
    workers[worker].busy = totalBytesRead < contentLength;
  }
};

addEventListener('penumbra-progress', trackWorkerBusyState);
