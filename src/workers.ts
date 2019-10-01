/* eslint-disable import/no-webpack-loader-syntax */

// comlink
import { proxy, wrap } from 'comlink';

// local
import {
  PenumbraWorker,
  PenumbraWorkerAPI,
  PenumbraWorkers,
  ProgressEmit,
  WorkerKind,
  WorkerLocation,
  WorkerLocationOptions,
} from './types';
import getKeys from './utils/getKeys';

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
  decrypt: 'decrypt.penumbra.worker.js',
  encrypt: 'encrypt.penumbra.worker.js',
  zip: 'zip.penumbra.worker.js',
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
  const options = {
    ...DEFAULT_WORKERS,
    ...JSON.parse(script.workers || '{}'),
  };
  const { base, decrypt, encrypt, zip, StreamSaver } = options;

  const context = resolve(base || scriptURL);

  return {
    base: context,
    decrypt: new URL(decrypt, context),
    encrypt: new URL(encrypt, context),
    zip: new URL(zip, context),
    StreamSaver: new URL(StreamSaver, context),
  };
}

/** Re-dispatch progress events */
function reDispatchProgressEvent(event: ProgressEmit): void {
  view.dispatchEvent(event);
}

const workers: Partial<PenumbraWorkers> = {};

/** Instantiate a Penumbra Worker */
export async function createPenumbraWorker(
  url: URL | string,
): Promise<PenumbraWorker> {
  // Use string literals to provide default worker URL hints to webpack
  // switch (String(url)) {
  //   case DEFAULT_WORKERS.decrypt: {
  //     const worker = new Worker('decrypt.penumbra.worker.js', {
  //       type: 'module',
  //     });
  //     return { worker, comlink: Comlink.wrap(worker) };
  //   }
  //   case DEFAULT_WORKERS.zip: {
  //     const worker = new Worker('zip.penumbra.worker.js', { type: 'module' });
  //     return { worker, comlink: Comlink.wrap(worker) };
  //   }
  //   case DEFAULT_WORKERS.StreamSaver: {
  //     const worker = new Worker('./streamsaver.penumbra.serviceworker.js', { type: 'module' });
  //     return { worker, comlink: Comlink.wrap(worker) };
  //   }
  //   default: {
  const worker = new Worker(url /* , { type: 'module' } */);
  const penumbraWorker: PenumbraWorker = {
    worker,
    comlink: wrap(worker),
    initialized: false,
  };
  const Link = penumbraWorker.comlink;
  const setup = new Link().then(async (thread: PenumbraWorkerAPI) => {
    await thread.setup(proxy(reDispatchProgressEvent));
  });
  await setup;
  penumbraWorker.initialized = true;
  return penumbraWorker;
  //   }
  // }
}
/** Initializes web worker threads */
export async function initWorkers(...workerTypes: WorkerKind[]): Promise<void> {
  const locations = getWorkerLocation();
  await Promise.all(
    workerTypes.map(async (worker) => {
      workers[worker] = await createPenumbraWorker(locations[worker]);
    }),
  );
}

/**
 * Get the initialize the workers (only does this once).s
 *
 * @returns The list of active worker threads
 */
export async function getWorkers(
  ...workerTypes: WorkerKind[]
): Promise<PenumbraWorkers> {
  if (
    // any uninitialized workers?
    workerTypes.some((workerType) => {
      const worker = workers[workerType];
      return !worker || (worker && !worker.initialized);
    })
  ) {
    await initWorkers(...workerTypes);
  }
  return workers as PenumbraWorkers;
}

/** Returns all active Penumbra Workers */
async function getActiveWorkers(): Promise<PenumbraWorker[]> {
  const initializedWorkers = await getWorkers();
  return getKeys(initializedWorkers)
    .filter(
      (worker) =>
        initializedWorkers[worker] &&
        (initializedWorkers[worker] as PenumbraWorker).initialized,
    )
    .map((worker) => initializedWorkers[worker] as PenumbraWorker);
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
 * // Set only the base URL by passing a string
 * penumbra.setWorkerLocation('/penumbra-workers/')
 * // Set all worker URLs by passing a WorkerLocation object
 * penumbra.setWorkerLocation({
 *   base: '/penumbra-workers/',
 *   decrypt: 'decrypt.js',
 *   encrypt: 'encrypt.js',
 *   zip: 'zip-debug.js', // e.g. manually use a debug worker
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
      ? { ...DEFAULT_WORKERS, base: options }
      : { ...DEFAULT_WORKERS, ...options },
  );
  return initWorkers();
}
