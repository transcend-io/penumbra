// comlink
import Comlink, { Remote } from 'comlink';

/**
 * Worker location options. All options support relative URLs.
 */
export type WorkerLocationOptions = {
  /** The directory where the workers scripts are available */
  base?: string;
  /** The location of the decryption Worker script */
  decrypt?: string;
  /** The location of the zip Worker script */
  zip?: string;
  /** The location of the StreamSaver ServiceWorker script */
  StreamSaver?: string;
};

/**
 * Worker location URLs. All fields are absolute URLs.
 */
export type WorkerLocation = {
  /** The directory where the workers scripts are available */
  base: URL;
  /** The location of the decryption Worker script */
  decrypt: URL;
  /** The location of the zip Worker script */
  zip: URL;
  /** The location of the StreamSaver ServiceWorker script */
  StreamSaver: URL;
};

/** An individual Penumbra Worker's interfaces */
export type PenumbraWorker = {
  /** The worker's DOM interface */
  worker: Worker;
  /** The worker's comlink interface */
  comlink: Remote<Worker>;
};

/** An individual Penumbra ServiceWorker's interfaces */
export type PenumbraServiceWorker = {
  /** The worker's DOM interface */
  worker: ServiceWorker;
  /** The worker's comlink interface */
  comlink: Remote<Worker>;
};

/** The penumbra workers themselves */
export type PenumbraWorkers = {
  /** The decryption Worker */
  decrypt: PenumbraWorker;
  /** The zip Worker */
  zip: PenumbraWorker;
  /** The StreamSaver ServiceWorker */
  StreamSaver?: PenumbraServiceWorker;
};

if (!document.currentScript) {
  throw new Error('Penumbra must be included in a document');
}

const penumbra = document.currentScript.dataset;

const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

const WORKER_DEFAULTS = JSON.stringify({
  decrypt: '/penumbra-decrypt.worker.js',
  zip: '/penumbra-zip.worker.js',
  StreamSaver: '/streamsaver.js',
});

/**
 * Resolve a potentially relative URL into an absolute URL
 */
function resolve(url: string): URL {
  resolver.href = url;
  // eslint-disable-next-line no-restricted-globals
  return new URL(resolver.href, location.href);
}

/**
 * Gets worker location configuration
 *
 * @param options - A stream of bytes to be saved to disk
 */
export function getWorkerLocation(): WorkerLocation {
  const { base, decrypt, zip, StreamSaver } = JSON.parse(
    penumbra.workers || WORKER_DEFAULTS,
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

/** Instantiate a Penumbra Worker */
export function createPenumbraWorker(url: URL | string): PenumbraWorker {
  const worker = new Worker((url as unknown) as string);
  return { worker, comlink: Comlink.wrap(worker) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workers: any = {};

/** Initializes web worker threads */
export function initWorkers(): void {
  if (!penumbra.initialized) {
    const { decrypt, zip } = getWorkerLocation();
    workers.decrypt = createPenumbraWorker(decrypt);
    workers.zip = createPenumbraWorker(zip);
    penumbra.initialized = (true as unknown) as string;
  }
}

/**
 * De-allocate temporary Worker object URLs
 */
function cleanup(): void {
  const threads = Object.keys(workers);
  threads.forEach((thread: string) => {
    const { worker } = workers[thread];
    if (worker) {
      worker.terminate();
    }
  });
}

window.addEventListener('beforeunload', cleanup);

/** Returns the list of active worker threads */
export function getWorkers(): PenumbraWorkers {
  const { decrypt, zip } = getWorkerLocation();
  if (!penumbra.initialized) {
    initWorkers();
  }
  return workers as PenumbraWorkers;
}

/**
 * Sets worker location configuration
 *
 * @param options - Worker location options
 */
export default function setWorkerLocation(
  options: WorkerLocationOptions,
): void {
  if (penumbra.initialized) {
    console.warn('Penumbra Workers are already active. Reinitializing...');
    cleanup();
  }
  penumbra.workers = JSON.stringify({ ...getWorkerLocation(), ...options });
  initWorkers();
}
