/* eslint-disable import/no-webpack-loader-syntax */

// comlink
import { Remote, wrap } from 'comlink';

// local
// import PenumbraDecryptionWorker from 'worker-loader!./decrypt.penumbra.worker';
// import PenumbraZipWorker from 'worker-loader!./zip.penumbra.worker';
import { RemoteReadableStream } from 'remote-web-streams';
import {
  PenumbraDecryptionWorkerAPI,
  PenumbraWorker,
  PenumbraWorkers,
  WorkerLocation,
  WorkerLocationOptions,
} from './types';
import getKeys from './utils/getKeys';

// //// //
// Init //
// //// //

// eslint-disable-next-line no-restricted-globals
if (!self.document) {
  throw new Error(
    'Penumbra must be included in a document as an unbundled script element.',
  );
}

const scriptElement =
  document.currentScript || document.querySelector('script[data-penumbra]');

if (!scriptElement) {
  throw new Error('Unable to locate Penumbra script element.');
}

const script = scriptElement.dataset;

const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

const DEFAULT_WORKERS = {
  decrypt: 'decrypt.penumbra.worker.js',
  zip: 'zip.penumbra.worker.js',
  StreamSaver: 'streamsaver.penumbra.serviceworker.js',
};

const DEFAULT_WORKERS_JSON = JSON.stringify(DEFAULT_WORKERS);

/**
 * Resolve a potentially relative URL into an absolute URL
 */
function resolve(url: string): URL {
  resolver.href = url;
  // eslint-disable-next-line no-restricted-globals
  return new URL(resolver.href, location.href);
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
  const { base, decrypt, zip, StreamSaver } = JSON.parse(
    script.workers || DEFAULT_WORKERS_JSON,
  );

  const missing: string[] = [];

  if (!decrypt) {
    missing.push('decrypt');
  }
  if (!zip) {
    missing.push('zip');
  }
  if (!StreamSaver) {
    missing.push('StreamSaver');
  }

  if (missing.length) {
    throw new Error(`Missing workers: "${missing.join('", "')}"`);
  }

  // eslint-disable-next-line no-restricted-globals
  const context = resolve(base || location.href);

  return {
    base: context,
    decrypt: new URL(decrypt, context),
    zip: new URL(zip, context),
    StreamSaver: new URL(StreamSaver, context),
  };
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
  return { worker, comlink: wrap(worker) };
  //   }
  // }
}

/** Initializes web worker threads */
export async function initWorkers(): Promise<void> {
  if (!script.initialized) {
    const { decrypt, zip } = getWorkerLocation();
    workers.decrypt = await createPenumbraWorker(decrypt);
    workers.zip = await createPenumbraWorker(zip);
    script.initialized = 'yes';
  }
}

/**
 * Get the initialize the workers (only does this once).s
 *
 * @returns The list of active worker threads
 */
export async function getWorkers(): Promise<PenumbraWorkers> {
  if (!script.initialized) {
    await initWorkers();
  }
  return workers as PenumbraWorkers;
}

/**
 * De-allocate temporary Worker object URLs
 */
async function cleanup(): Promise<void> {
  const initializedWorkers = await getWorkers();
  const threads = getKeys(initializedWorkers);
  threads.forEach((thread) => {
    const workerInstance = initializedWorkers[thread];
    if (
      workerInstance &&
      workerInstance.worker &&
      workerInstance.worker instanceof Worker
    ) {
      workerInstance.worker.terminate();
    }
  });
}

// eslint-disable-next-line no-restricted-globals
self.addEventListener('beforeunload', cleanup);

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
 *   base: '/penumbra-workers',
 *   decrypt: 'decrypt.js'
 *   zip: 'zip-debug.js' // e.g. manually use a debug worker
 *   StreamSaver: 'StreamSaver.js'
 * });
 * // Set a single worker's location
 * penumbra.setWorkerLocation({decrypt: 'penumbra.decrypt.js'});
 * ```
 */
 * /
export async function setWorkerLocation(
  options: WorkerLocationOptions | string,
): Promise<void> {
  if (script.initialized) {
    console.warn('Penumbra Workers are already active. Reinitializing...');
    cleanup();
  }
  script.workers = JSON.stringify({
    ...getWorkerLocation(),
    ...(typeof options === 'string' ? { base: options } : options),
  });
  await initWorkers();
  return undefined;
}
