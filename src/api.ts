// Remote
import { transfer } from 'comlink';
import { RemoteReadableStream, RemoteWritableStream } from 'remote-web-streams';
import mime from 'mime';
import {
  StreamSaverInstance,
  type StreamSaverEndpoint,
} from './streamsaver.js';

// Local
import type {
  JobCompletionEmit,
  JobID,
  PenumbraDecryptionOptions,
  PenumbraFileWithID,
  PenumbraEncryptionOptions,
  PenumbraFile,
  PenumbraTextOrURI,
  RemoteResource,
  ZipOptions,
  PenumbraDecryptionInfo,
} from './types.js';
import { PenumbraZipWriter } from './zip.js';
import {
  blobCache,
  isNumber,
  isViewableText,
  parseBase64OrUint8Array,
} from './utils/index.js';
import { getWorker, syncLogLevelUpdateToAllWorkers } from './workers.js';
import { supported } from './ua-support.js';
import { preconnect, preload } from './resource-hints.js';
import { createChunkSizeTransformStream } from './create-chunk-size-transform-stream.js';
import { logger, type LogLevel } from './logger.js';
import { generateJobID } from './job-id.js';

/** Size (and entropy of) generated AES-256 key (in bits) */
const GENERATED_KEY_RANDOMNESS = 256;
/** Size (and entropy of) generated 12-byte initialization vector (in bits) */
const IV_RANDOMNESS = 96;

// Track completion of unawaited decryption pipelines for `getDecryptionInfo()`
const decryptionConfigs = new Map<JobID, PenumbraDecryptionInfo>();
const listener = ({
  detail: { id, decryptionInfo },
}: JobCompletionEmit): void => {
  decryptionConfigs.set(id, decryptionInfo);
};
self.addEventListener('penumbra-complete', listener);
const trackJobCompletion = (
  searchForID: JobID,
): Promise<PenumbraDecryptionInfo> =>
  new Promise((resolve) => {
    const interval = setInterval(() => {
      if (decryptionConfigs.has(searchForID)) {
        const decryptionInfo = decryptionConfigs.get(searchForID);
        decryptionConfigs.delete(searchForID);
        clearInterval(interval);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- .has() guarantees it exists
        resolve(decryptionInfo!);
      }
    }, 100);
  });

const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

/**
 * Retrieve and decrypt files (batch job)
 * @param resource - Resource
 * @returns Penumbra files
 */
async function getJob(resource: RemoteResource): Promise<PenumbraFileWithID> {
  // Create remote readable streams
  const remoteStream = new RemoteReadableStream();

  const { url } = resource;
  resolver.href = url;
  const path = resolver.pathname; // derive path from URL
  const readable = {
    path,
    ...resource,
    stream: remoteStream.readable,
  };

  const { writablePort } = remoteStream;

  // Generate an ID for this job run
  const jobID = generateJobID();

  // Kick off the worker to fetch and decrypt the files, and start writing to the returned streams
  const worker = await getWorker();
  const RemoteAPI = worker.comlink;
  logger.debug(
    `penumbra.get(): connecting to worker with workerID: ${worker.id.toString()}`,
    jobID,
  );
  const remote = await new RemoteAPI();
  logger.debug(`penumbra.get(): requesting file from worker`, jobID);
  await remote.get(transfer(writablePort, [writablePort]), resource, jobID);
  return { ...readable, id: jobID };
}

/**
 * penumbra.get() API
 *
 * ```ts
 * // Load a resource and get a ReadableStream
 * await penumbra.get(resource);
 *
 * // Buffer all responses & read them as text
 * await Promise.all((await penumbra.get(resources)).map(({ stream }) =>
 *   new Response(stream).text()
 * ));
 *
 * // Buffer a response & read as text
 * await new Response((await penumbra.get(resource))[0].stream).text();
 *
 * // Example call with an included resource
 * await penumbra.get([{
 *   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
 *   filePrefix: 'NYT',
 *   mimetype: 'text/plain',
 *   decryptionOptions: {
 *   key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
 *   iv: '6lNU+2vxJw6SFgse',
 *   authTag: 'gadZhS1QozjEmfmHLblzbg==',
 * }]);
 * ```
 * @param resources - Resources to fetch
 * @returns Penumbra files
 */
function get(...resources: RemoteResource[]): Promise<PenumbraFileWithID[]> {
  if (resources.length === 0) {
    throw new Error('penumbra.get() called without arguments');
  }
  return Promise.all(
    resources.map((resource, index) => {
      if (!('url' in resource)) {
        throw new TypeError(
          `penumbra.get(): RemoteResource missing URL at index ${index.toString()}`,
        );
      }
      return getJob(resource);
    }),
  );
}

const DEFAULT_FILENAME = 'download';
const DEFAULT_MIME_TYPE = 'application/octet-stream';

/**
 * Save a zip containing files retrieved by Penumbra
 * @param options - ZipOptions
 * @returns PenumbraZipWriter class instance
 */
function saveZip(options: ZipOptions): PenumbraZipWriter {
  return new PenumbraZipWriter(options);
}

/**
 * Save files retrieved by Penumbra
 * @param files - Files to save
 * @param fileName - The name of the file to save to
 * @param controller - AbortController
 */
async function save(
  files: PenumbraFile[],
  streamSaverEndpoint: StreamSaverEndpoint,
  fileName?: string,
  controller = new AbortController(),
): Promise<void> {
  let size: number | undefined = 0;

  for (const file of files) {
    if (!isNumber(file.size)) {
      size = undefined;
      break;
    }
    size += file.size;
  }

  // Multiple files
  if ('length' in files && files.length > 1) {
    const writer = saveZip({
      name: fileName ?? `${DEFAULT_FILENAME}.zip`,
      size,
      controller,
      streamSaverEndpoint,
    });
    await writer.write(...files);
    await writer.close();
    return;
  }

  // Single file
  const file = 'stream' in files ? (files as PenumbraFile) : files[0];
  if (!file) {
    throw new Error('penumbra.save(): No file to save');
  }

  // Split filename and extension
  const [filename, extensionCandidateFromFilename] = (
    fileName ??
    file.filePrefix ??
    DEFAULT_FILENAME
  )
    .split(/(\.\w+\s*$)/) // split filename extension
    .filter(Boolean) as [string, string | undefined]; // filter empty matches

  // Get extension from mimetype
  const extensionCandidateFromMime =
    file.mimetype && mime.getExtension(file.mimetype);

  const extension =
    extensionCandidateFromFilename?.slice(1) ??
    extensionCandidateFromMime ??
    '';

  const singleFileName = `${filename}.${extension}`;

  const { signal } = controller;

  const { streamSaver } = new StreamSaverInstance(streamSaverEndpoint);

  // Write a single readable stream to file
  await file.stream.pipeTo(
    streamSaver.createWriteStream(singleFileName, {
      size: file.size,
    }),
    { signal },
  );
}

/**
 * Load files retrieved by Penumbra into memory as a Blob
 * @param files - Files to load
 * @param type - Mimetype
 * @returns A blob of the data
 */
function getBlob(
  files: PenumbraFile[] | PenumbraFile | ReadableStream,
  type?: string, // = data[0].mimetype
): Promise<Blob> {
  if ('length' in files && files.length > 1) {
    throw new Error('penumbra.getBlob(): Called with multiple files');
  }
  let rs: ReadableStream;
  let fileType: string | undefined;
  if (files instanceof ReadableStream) {
    rs = files;
  } else {
    const file = 'length' in files ? files[0] : files;
    if (!file) {
      throw new Error('penumbra.getBlob(): No file to get blob for');
    }
    if (file.stream instanceof ArrayBuffer || ArrayBuffer.isView(file.stream)) {
      return Promise.resolve(
        new Blob(
          [
            new Uint8Array(
              file.stream as ArrayBufferLike,
              0,
              file.stream.byteLength,
            ),
          ],
          { ...(file.mimetype ? { type: file.mimetype } : {}) },
        ),
      );
    }
    rs = file.stream;
    fileType = file.mimetype;
  }

  const headers = new Headers({
    'Content-Type': type ?? fileType ?? DEFAULT_MIME_TYPE,
  });

  return new Response(rs, { headers }).blob();
}

/**
 * Get the decryption config for an encrypted file
 *
 * ```ts
 * penumbra.getDecryptionInfo(file: PenumbraFileWithID): Promise<PenumbraDecryptionInfo>
 * ```
 * @param file - File to get info for
 * @returns Decryption info
 */
function getDecryptionInfo(
  file: PenumbraFileWithID,
): Promise<PenumbraDecryptionInfo> {
  const { id } = file;
  if (!decryptionConfigs.has(id)) {
    // decryption config not yet received. waiting for event with promise
    return trackJobCompletion(id);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- .has() guarantees it exists
  return Promise.resolve(decryptionConfigs.get(id)!);
}

/**
 * penumbra.encrypt() API
 *
 * ```ts
 * await penumbra.encrypt(options, file);
 * // usage example:
 * size = 4096 * 64 * 64;
 * addEventListener('penumbra-progress',(e)=>console.log(e.type, e.detail));
 * addEventListener('penumbra-complete',(e)=>console.log(e.type, e.detail));
 * file = penumbra.encrypt(null, {stream: new Uint8Array(size), size});
 * let data = [];
 * file.then(async ([encrypted]) => {
 *   console.log('encryption started');
 *   data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
 * });
 * ```
 * @param options - Options
 * @param file - File
 * @returns Encrypted file
 */
async function encrypt(
  options: Partial<PenumbraEncryptionOptions> | null,
  file: PenumbraFile,
): Promise<PenumbraFileWithID> {
  // Generate an ID for this job run
  const jobID = generateJobID();

  // Generate a key if one is not provided
  let rawKey = options?.key;
  if (!rawKey) {
    logger.info(
      `penumbra.encrypt(): no key specified. generating a random ${GENERATED_KEY_RANDOMNESS.toString()}-bit key`,
      jobID,
    );
    rawKey = crypto.getRandomValues(
      new Uint8Array(GENERATED_KEY_RANDOMNESS / 8),
    );
  }
  // Generate an IV if one is not provided
  let rawIV = options?.iv;
  if (!rawIV) {
    logger.info(
      `penumbra.encrypt(): no IV specified. generating a random ${IV_RANDOMNESS.toString()}-bit IV`,
      jobID,
    );
    rawIV = crypto.getRandomValues(new Uint8Array(IV_RANDOMNESS / 8));
  }

  // Set up remote streams
  const { writable, readablePort } = new RemoteWritableStream<Uint8Array>();
  const { readable, writablePort } = new RemoteReadableStream<Uint8Array>();

  // Create a `TransformStream` which sends chunks to the worker, and receives chunks back.
  const remoteTransformStream: TransformStream<Uint8Array, Uint8Array> = {
    // The `WritableStream` we write chunks to by reading from `files[i].stream`. Chunks are sent to the Worker.
    writable,
    // The `ReadableStream` we read chunks from and ultimately pass to the library consumer. Chunks are received from the Worker.
    readable,
  };

  // Enter worker thread and kick off the encryption
  const worker = await getWorker();
  logger.debug(
    `penumbra.encrypt(): connecting to worker with workerID: ${worker.id.toString()}`,
    jobID,
  );
  const RemoteAPI = worker.comlink;
  const remote = await new RemoteAPI();

  // Convert to Uint8Array
  const key = parseBase64OrUint8Array(rawKey);
  const iv = parseBase64OrUint8Array(rawIV);

  // Set up encryption job, but don't await
  logger.debug(
    `penumbra.encrypt(): requesting encryption stream from worker`,
    jobID,
  );
  await remote.encrypt(
    key,
    iv,
    jobID,
    file.size ?? null,
    transfer(readablePort, [readablePort]),
    transfer(writablePort, [writablePort]),
  );

  // Create a `TransformStream` which breaks huge chunks into smaller chunks. Otherwise, it will basically "one-shot" slowly.
  const chunkSizeTransformStream = createChunkSizeTransformStream();

  // Return a `ReadableStream` which is transforming through the web worker
  const stream = file.stream
    .pipeThrough(chunkSizeTransformStream)
    .pipeThrough(remoteTransformStream);

  return {
    ...file,
    id: jobID,
    stream,
  };
}

/**
 * penumbra.decrypt() API
 *
 * Decrypts files encrypted by penumbra.encrypt()
 *
 * ```ts
 * await penumbra.decrypt(options, file);
 * // usage example:
 * size = 4096 * 64 * 64;
 * addEventListener('penumbra-progress',(e)=>console.log(e.type, e.detail));
 * addEventListener('penumbra-complete',(e)=>console.log(e.type, e.detail));
 * file = penumbra.encrypt(null, {stream: new Uint8Array(size), size});
 * let data = [];
 * file.then(async ([encrypted]) => {
 *   console.log('encryption started');
 *   data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
 * });
 * ```
 * @param options - Options
 * @param file - File
 * @returns File
 */
async function decrypt(
  options: PenumbraDecryptionOptions,
  file: PenumbraFileWithID,
): Promise<PenumbraFileWithID> {
  if (!options.key || !options.iv || !options.authTag) {
    throw new Error('penumbra.decrypt(): missing decryption options');
  }

  // Generate an ID for this job run
  const jobID = generateJobID();

  // Set up remote streams
  const { writable, readablePort } = new RemoteWritableStream<Uint8Array>();
  const { readable, writablePort } = new RemoteReadableStream<Uint8Array>();

  // Create a `TransformStream` which sends chunks to the worker, and receives chunks back.
  const remoteTransformStream: TransformStream<Uint8Array, Uint8Array> = {
    // The `WritableStream` we write chunks to by reading from `files[i].stream`. Chunks are sent to the Worker.
    writable,
    // The `ReadableStream` we read chunks from and ultimately pass to the library consumer. Chunks are received from the Worker.
    readable,
  };

  // Enter worker thread and kick off the decryption
  const worker = await getWorker();
  logger.debug(
    `penumbra.decrypt(): connecting to worker with workerID: ${worker.id.toString()}`,
    jobID,
  );
  const RemoteAPI = worker.comlink;
  const remote = await new RemoteAPI();

  // Convert to Uint8Array
  const key = parseBase64OrUint8Array(options.key);
  const iv = parseBase64OrUint8Array(options.iv);
  const authTag = parseBase64OrUint8Array(options.authTag);

  // Set up decryption job, but don't await
  logger.debug(
    `penumbra.decrypt(): requesting decryption stream from worker`,
    jobID,
  );
  await remote.decrypt(
    key,
    iv,
    authTag,
    jobID,
    file.size ?? null,
    transfer(readablePort, [readablePort]),
    transfer(writablePort, [writablePort]),
  );

  // Create a `TransformStream` which breaks huge chunks into smaller chunks. Otherwise, it will basically "one-shot" slowly.
  const chunkSizeTransformStream = createChunkSizeTransformStream();

  // Return a `ReadableStream` which is transforming through the web worker
  const stream = file.stream
    .pipeThrough(chunkSizeTransformStream)
    .pipeThrough(remoteTransformStream);

  return {
    ...file,
    id: jobID,
    stream,
  };
}

/**
 * Get file text (if content is viewable) or URI (if content is not viewable)
 * @param files - A list of files to get the text of
 * @returns A list with the text itself or a URI encoding the file if applicable
 */
function getTextOrURI(files: PenumbraFile[]): Promise<PenumbraTextOrURI>[] {
  return files.map(async (file): Promise<PenumbraTextOrURI> => {
    const { mimetype = '' } = file;
    if (mimetype && isViewableText(mimetype)) {
      return {
        type: 'text',
        data: await new Response(file.stream).text(),
        mimetype,
      };
    }
    const url = URL.createObjectURL(await getBlob(file));
    const cache = blobCache.get();
    cache.push(new URL(url));
    blobCache.set(cache);
    return { type: 'uri', data: url, mimetype };
  });
}

function setLogLevel(logLevel: LogLevel, wait?: false): void;
function setLogLevel(logLevel: LogLevel, wait: true): Promise<void>;
function setLogLevel(logLevel: LogLevel, wait?: boolean): Promise<void> | void {
  logger.setLogLevel(logLevel);

  /**
   * This is intentionally not awaited because it adds complexity for library consumers to have to await setLogLevel().
   * In the recommended usage, the `setLogLevel()` should be called before any worker methods are called, in which case this runs synchronously.
   */
  const promise = syncLogLevelUpdateToAllWorkers(logLevel).catch(
    (error: unknown) => {
      const errorMessage = `penumbra.setLogLevel(): Failed to sync log level update to all workers: ${
        error instanceof Error ? error.message : String(error)
      }`;
      if (wait) {
        throw new Error(errorMessage);
      } else {
        logger.error(errorMessage, null);
      }
    },
  );
  if (wait) {
    return promise;
  }
}

const penumbra = {
  preconnect,
  preload,
  get,
  encrypt,
  decrypt,
  getDecryptionInfo,
  save,
  supported,
  getBlob,
  getTextOrURI,
  saveZip,
  setLogLevel,
};

/**
 * Penumbra API type
 */
export type Penumbra = typeof penumbra;

export { penumbra };
