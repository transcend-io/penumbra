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

if (!document.currentScript) {
  throw new Error('Penumbra must be included in a document');
}

const penumbra = document.currentScript.dataset;

export const workers: Worker[] = [];

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

/**
 * Sets worker location configuration
 *
 * @param options - Worker location options
 */
export default function setWorkerLocation(
  options: WorkerLocationOptions,
): void {
  if (penumbra['active-workers']) {
    console.warn('Penumbra Workers are already active. Reinitializing...');
    // TODO: implement worker reinitialization logic
  }
  penumbra.workers = JSON.stringify({ ...getWorkerLocation(), ...options });
}
