"use strict";
/* eslint-disable max-lines, no-plusplus, import/no-webpack-loader-syntax */
Object.defineProperty(exports, "__esModule", { value: true });
// comlink
const comlink_1 = require("comlink");
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
    throw new Error('Penumbra must be included in a document as an unbundled script element.');
}
/** Whether or not Penumbra has been initialized */
let initialized = false;
/** Whether or not Penumbra is currently initializing workers */
let initializing = false;
// //////////// //
// Load Workers //
// //////////// //
if (SHOULD_LOG_EVENTS) {
    console.info('Loading penumbra script element...');
}
let scriptElement = (document.currentScript ||
    document.querySelector('script[data-penumbra]'));
if (!scriptElement) {
    scriptElement = { dataset: {} };
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
const resolver = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
/**
 * Resolve a potentially relative URL into an absolute URL
 */
function resolve(url) {
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
function getWorkerLocation() {
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
exports.getWorkerLocation = getWorkerLocation;
/** Re-dispatch events */
function reDispatchEvent(event) {
    if (view.dispatchEvent) {
        view.dispatchEvent(event);
    }
}
// Set data-worker-limit to limit the maximum number of Penumbra workers
const WORKER_LIMIT = +(script.workerLimit || 16);
// Get available processor threads
const availConcurrency = // Default to 4 threads if nav.hwConcurrency isn't supported
 (navigator.hardwareConcurrency || 4) -
    // Reserve one thread for UI renderer to prevent jank
    1;
const maxConcurrency = availConcurrency > WORKER_LIMIT ? WORKER_LIMIT : availConcurrency;
const workers = [];
let workerID = 0;
/** Instantiate a Penumbra Worker */
async function createPenumbraWorker(url) {
    const worker = new Worker(url /* , { type: 'module' } */);
    const id = workerID++;
    const penumbraWorker = {
        worker,
        id,
        comlink: comlink_1.wrap(worker),
        busy: false,
    };
    const Link = penumbraWorker.comlink;
    const setup = new Link().then(async (thread) => {
        await thread.setup(id, comlink_1.proxy(reDispatchEvent));
    });
    await setup;
    return penumbraWorker;
}
exports.createPenumbraWorker = createPenumbraWorker;
const onWorkerInitQueue = [];
/** Get any free worker thread */
function getFreeWorker() {
    // Poll for any available free workers
    const freeWorker = workers.find(({ busy }) => !busy);
    // return any free worker or a random one if all are busy
    const worker = freeWorker || workers[Math.floor(Math.random() * workers.length)];
    // Set worker as busy
    worker.busy = true;
    return worker;
}
/** Wait for workers to initialize */
function waitForInit() {
    return new Promise((resolveWorker) => {
        onWorkerInitQueue.push(() => {
            resolveWorker(getFreeWorker());
        });
    });
}
const call = Function.prototype.call.bind(Function.prototype.call);
/** Initializes web worker threads */
async function initWorkers() {
    initializing = true;
    const { penumbra } = getWorkerLocation();
    workers.push(...(await Promise.all(
    // load all workers in parallel
    new Array(Math.max(maxConcurrency - workers.length, 0))
        .fill(0) // incorrect built-in types prevent .fill()
        .map(() => createPenumbraWorker(penumbra)))));
    initializing = false;
    initialized = true;
    // Dispatch worker init ready queue
    onWorkerInitQueue.forEach(call);
    onWorkerInitQueue.length = 0;
}
exports.initWorkers = initWorkers;
/**
 * Get and initialize the Penumbra Worker thread
 *
 * @returns The list of active worker threads
 */
async function getWorker() {
    if (initializing) {
        return waitForInit();
    }
    if (!initialized) {
        await initWorkers();
    }
    return getFreeWorker();
}
exports.getWorker = getWorker;
/** Returns all active Penumbra Workers */
function getActiveWorkers() {
    return workers;
}
/**
 * Terminate Penumbra worker and de-allocate their resources
 */
function cleanup() {
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
async function setWorkerLocation(options) {
    if (initialized) {
        console.warn('Penumbra Workers are already active. Reinitializing...');
        await cleanup();
    }
    script.workers = JSON.stringify(typeof options === 'string'
        ? { ...DEFAULT_WORKERS, base: options, penumbra: options }
        : { ...DEFAULT_WORKERS, ...options });
    return initWorkers();
}
exports.setWorkerLocation = setWorkerLocation;
/** Set worker busy state based on current progress events */
const trackWorkerBusyState = ({ detail: { worker, totalBytesRead, contentLength }, }) => {
    if (typeof worker === 'number' && totalBytesRead >= contentLength) {
        workers[worker].busy = false;
    }
};
addEventListener('penumbra-progress', trackWorkerBusyState);
//# sourceMappingURL=workers.js.map