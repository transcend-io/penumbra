import { PenumbraWorker, WorkerLocation, WorkerLocationOptions } from './types';
/**
 * Gets worker location configuration
 *
 * @param options - A stream of bytes to be saved to disk
 */
export declare function getWorkerLocation(): WorkerLocation;
/** Instantiate a Penumbra Worker */
export declare function createPenumbraWorker(url: URL | string): Promise<PenumbraWorker>;
/** Initializes web worker threads */
export declare function initWorkers(): Promise<void>;
/**
 * Get and initialize the Penumbra Worker thread
 *
 * @returns The list of active worker threads
 */
export declare function getWorker(): Promise<PenumbraWorker>;
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
export declare function setWorkerLocation(options: WorkerLocationOptions | string): Promise<void>;
//# sourceMappingURL=workers.d.ts.map