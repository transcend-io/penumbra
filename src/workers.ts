/* eslint-disable import/no-webpack-loader-syntax */

// comlink
import { proxy, wrap } from 'comlink';

// local
import {
  PenumbraWorker,
  PenumbraWorkerAPI,
  WorkerLocation,
  WorkerLocationOptions,
} from './types';

// //// //
// Init //
// //// //
const view = self;

if (!view.document) {
  throw new Error(
    'Penumbra must be included in a document as an unbundled script element.',
  );
}

const scriptElement = (document.currentScript ||
  document.querySelector('script[data-penumbra]')) as HTMLScriptElement;

if (!scriptElement) {
  throw new Error('Unable to locate Penumbra script element.');
}

const script = scriptElement.dataset;

const initialized = false;

const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

const scriptURL = new URL(scriptElement.src, location.href);

const DEFAULT_WORKERS = {
  penumbra: 'penumbra.worker.js',
  StreamSaver: 'streamsaver.penumbra.serviceworker.js',
};

/**
 * Resolve a potentially relative URL into an absolute URL
 */
function resolve(url: string): URL {
  resolver.href = url;
  return new URL(resolver.href, scriptURL);
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

  const context = resolve(base || scriptURL);

  return {
    base: context,
    penumbra: new URL(penumbra, context),
    StreamSaver: new URL(StreamSaver, context),
  };
}

/** Re-dispatch events */
function reDispatchEvent(event: CustomEvent): void {
  view.dispatchEvent(event);
}

let workerThread: PenumbraWorker;

/** Instantiate a Penumbra Worker */
export async function createPenumbraWorker(
  url: URL | string,
): Promise<PenumbraWorker> {
  const worker = new Worker(url /* , { type: 'module' } */);
  const penumbraWorker: PenumbraWorker = {
    worker,
    comlink: wrap(worker),
    initialized: false,
  };
  const Link = penumbraWorker.comlink;
  const setup = new Link().then(async (thread: PenumbraWorkerAPI) => {
    await thread.setup(proxy(reDispatchEvent));
  });
  await setup;
  penumbraWorker.initialized = true;
  return penumbraWorker;
}
/** Initializes web worker threads */
export async function initWorker(): Promise<void> {
  const { penumbra } = getWorkerLocation();
  workerThread = await createPenumbraWorker(penumbra);
}

/**
 * Get and initialize the Penumbra Worker thread
 *
 * @returns The list of active worker threads
 */
export async function getWorker(): Promise<PenumbraWorker> {
  if (!workerThread || (workerThread && !workerThread.initialized)) {
    await initWorker();
  }
  return workerThread as PenumbraWorker;
}

/** Returns all active Penumbra Workers */
async function getActiveWorkers(): Promise<PenumbraWorker[]> {
  const worker = await getWorker();
  return worker && worker.initialized ? [worker] : [];
}

/**
 * Terminate Penumbra Worker and de-allocate their resources
 */
async function cleanup(): Promise<void> {
  (await getActiveWorkers()).forEach((thread) => {
    thread.worker.terminate();
    // eslint-disable-next-line no-param-reassign
    thread.initialized = false;
  });
}

view.addEventListener('beforeunload', cleanup);

/**
 * Configure the location of Penumbra's worker threads
 *
 * @param options - Worker location options
 *
 * ```ts
 * // Set only the Penumbra Worker URL by passing a string. Base URL is derrived from this
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
  return initWorker();
}
