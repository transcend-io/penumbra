/* eslint-disable max-lines */
// Remote
import { transfer } from 'comlink';
import { RemoteReadableStream, RemoteWritableStream } from 'remote-web-streams';
import mime from 'mime';
import { streamSaver } from './streamsaver';

// Local
import type {
  JobCompletionEmit,
  JobID,
  PenumbraDecryptionInfo,
  PenumbraEncryptedFile,
  PenumbraEncryptionOptions,
  PenumbraFile,
  PenumbraTextOrURI,
  RemoteResource,
  ZipOptions,
} from './types';
import { PenumbraZipWriter } from './zip';
import { blobCache, isNumber, isViewableText } from './utils';
import { getWorker, setWorkerLocation } from './workers';
import { supported } from './ua-support';
import { preconnect, preload } from './resource-hints';
import { createChunkSizeTransformStream } from './createChunkSizeTransformStream';
import { logger } from './logger';

const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

/**
 * Retrieve and decrypt files (batch job)
 * @param resources - Resources
 * @returns Penumbra files
 */
async function getJob(...resources: RemoteResource[]): Promise<PenumbraFile[]> {
  if (resources.length === 0) {
    throw new Error('penumbra.get() called without arguments');
  }

  // Create remote readable streams
  const remoteStreams = resources.map(() => new RemoteReadableStream());
  const readables = remoteStreams.map((stream, i) => {
    const { url } = resources[i];
    resolver.href = url;
    const path = resolver.pathname; // derive path from URL
    return {
      path,
      // derived path is overridden if PenumbraFile contains path
      ...resources[i],
      stream: stream.readable,
    };
  });
  const writablePorts = remoteStreams.map(({ writablePort }) => writablePort);

  // Kick off the worker to fetch and decrypt the files, and start writing to the returned streams
  const worker = await getWorker();
  const RemoteAPI = worker.comlink;
  const remote = await new RemoteAPI();
  await remote.get(transfer(writablePorts, writablePorts), resources);
  return readables as PenumbraFile[];
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
export function get(...resources: RemoteResource[]): Promise<PenumbraFile[]> {
  return Promise.all(
    resources.map(async (resource) => (await getJob(resource))[0]),
  );
}

const DEFAULT_FILENAME = 'download';
const DEFAULT_MIME_TYPE = 'application/octet-stream';

/**
 * Save a zip containing files retrieved by Penumbra
 * @param options - ZipOptions
 * @returns PenumbraZipWriter class instance
 */
function saveZip(options?: ZipOptions): PenumbraZipWriter {
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
  fileName?: string,
  controller = new AbortController(),
): Promise<void> {
  let size: number | undefined = 0;
  // eslint-disable-next-line no-restricted-syntax
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
      name: fileName || `${DEFAULT_FILENAME}.zip`,
      size,
      files,
      controller,
    });
    await writer.write(...files);
    return;
  }

  // Single file
  const file: PenumbraFile =
    'stream' in files ? (files as unknown as PenumbraFile) : files[0];
  const [
    filename,
    extension = file.mimetype ? mime.getExtension(file.mimetype) : '',
  ] = (fileName || file.filePrefix || DEFAULT_FILENAME)
    .split(/(\.\w+\s*$)/) // split filename extension
    .filter(Boolean); // filter empty matches

  const singleFileName = `${filename}${extension}`;

  const { signal } = controller;

  // Write a single readable stream to file
  await file.stream.pipeTo(streamSaver.createWriteStream(singleFileName), {
    signal,
  });
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
          { type: file.mimetype },
        ),
      );
    }
    rs = file.stream;
    fileType = file.mimetype;
  }

  const headers = new Headers({
    'Content-Type': type || fileType || DEFAULT_MIME_TYPE,
  });

  return new Response(rs, { headers }).blob();
}

let jobID = 0;
const decryptionConfigs = new Map<JobID, PenumbraDecryptionInfo>();

const trackJobCompletion = (
  searchForID: JobID,
): Promise<PenumbraDecryptionInfo> =>
  new Promise((resolve) => {
    const listener = ({
      type,
      detail: { id, decryptionInfo },
    }: JobCompletionEmit): void => {
      decryptionConfigs.set(id, decryptionInfo);
      if (typeof searchForID !== 'undefined' && `${id}` === `${searchForID}`) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (self.removeEventListener as any)(type, listener);
        resolve(decryptionInfo);
      }
    };
    self.addEventListener('penumbra-complete', listener);
  });

/**
 * Get the decryption config for an encrypted file
 *
 * ```ts
 * penumbra.getDecryptionInfo(file: PenumbraEncryptedFile): Promise<PenumbraDecryptionInfo>
 * ```
 * @param file - File to get info for
 * @returns Decryption info
 */
export function getDecryptionInfo(
  file: PenumbraEncryptedFile,
): Promise<PenumbraDecryptionInfo> {
  const { id } = file;
  if (!decryptionConfigs.has(id)) {
    // decryption config not yet received. waiting for event with promise
    return trackJobCompletion(id);
  }
  return Promise.resolve(decryptionConfigs.get(id) as PenumbraDecryptionInfo);
}

/**
 * Encrypt files (batch job)
 * @param options - Options
 * @param files - Files to operate on
 * @returns Encrypted files
 */
async function encryptJob(
  options: PenumbraEncryptionOptions | null,
  ...files: PenumbraFile[] // TODO this is always one file. Simplify code
): Promise<PenumbraEncryptedFile[]> {
  // Ensure a file is passed
  if (files.length === 0) {
    throw new Error('penumbra.encrypt() called without arguments');
  }

  // collect file sizes and assign job IDs for completion tracking
  const ids: JobID<number>[] = [];
  const sizes: number[] = [];
  files.forEach((file) => {
    // eslint-disable-next-line no-plusplus, no-param-reassign
    ids.push((file.id = jobID++));
    const { size } = file;
    if (size) {
      sizes.push(size);
    } else {
      throw new Error('penumbra.encrypt(): Unable to determine file size');
    }
  });

  // Set up remote streams
  const remoteReadableStreams = files.map(() => new RemoteReadableStream());
  const remoteWritableStreams = files.map(() => new RemoteWritableStream());

  // extract ports from remote readable/writable streams for Comlink.transfer
  const readablePorts = remoteWritableStreams.map(
    ({ readablePort }) => readablePort,
  );
  const writablePorts = remoteReadableStreams.map(
    ({ writablePort }) => writablePort,
  );

  // Enter worker thread and kick off the encryption
  const worker = await getWorker();
  const RemoteAPI = worker.comlink;
  const remote = await new RemoteAPI();

  // Set up encryption job, but don't await
  const encryptionPromise = remote.encrypt(
    options,
    ids,
    sizes,
    transfer(readablePorts, readablePorts),
    transfer(writablePorts, writablePorts),
  );

  encryptionPromise.catch((error) => {
    logger.error(`penumbra.encrypt() - worker failed to encrypt: ${error}`);
  });

  // Construct output files with corresponding remote readable streams
  const readables: PenumbraEncryptedFile[] = remoteReadableStreams.map(
    (_, i): PenumbraEncryptedFile => {
      // Create a `TransformStream` which sends chunks to the worker, and receives chunks back.
      const { writable } = remoteWritableStreams[i];
      const { readable } = remoteReadableStreams[i];
      const remoteTransformStream: TransformStream<Uint8Array, Uint8Array> = {
        // The `WritableStream` we write chunks to by reading from `files[i].stream`. Chunks are sent to the Worker.
        writable,
        // The `ReadableStream` we read chunks from and ultimately pass to the library consumer. Chunks are received from the Worker.
        readable,
      };

      // Create a `TransformStream` which breaks huge chunks into smaller chunks. Otherwise, it will basically "one-shot" slowly.
      const chunkSizeTransformStream = createChunkSizeTransformStream();

      // Return a `ReadableStream` which is transforming through the web worker
      const stream = files[i].stream
        .pipeThrough(chunkSizeTransformStream)
        .pipeThrough(remoteTransformStream);

      return {
        ...files[i],
        // iv: metadata[i].iv,
        stream,
        size: sizes[i],
        id: ids[i],
      };
    },
  );
  return readables;
}

/**
 * penumbra.encrypt() API
 *
 * ```ts
 * await penumbra.encrypt(options, ...files);
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
 * @param files - Files
 * @returns Encrypted files
 */
export function encrypt(
  options: PenumbraEncryptionOptions | null,
  ...files: PenumbraFile[]
): Promise<PenumbraEncryptedFile[]> {
  return Promise.all(
    files.map(async (file) => (await encryptJob(options, file))[0]),
  );
}

/**
 * Decrypt files encrypted by penumbra.encrypt() (batch job)
 * @param options - Options
 * @param files - Files
 * @returns Penumbra files
 */
async function decryptJob(
  options: PenumbraDecryptionInfo,
  ...files: PenumbraEncryptedFile[] // TODO this is always one file. Simplify code
): Promise<PenumbraFile[]> {
  if (files.length === 0) {
    throw new Error('penumbra.decrypt() called without arguments');
  }

  const worker = await getWorker();
  const RemoteAPI = worker.comlink;
  const remoteReadableStreams = files.map(() => new RemoteReadableStream());
  const remoteWritableStreams = files.map(() => new RemoteWritableStream());
  const ids: JobID<number>[] = [];
  const sizes: number[] = [];
  // collect file sizes and assign job IDs for completion tracking
  files.forEach((file) => {
    // eslint-disable-next-line no-plusplus, no-param-reassign
    ids.push((file.id = file.id || jobID++));
    const { size } = file;
    if (size) {
      sizes.push(size);
    } else {
      throw new Error('penumbra.decrypt(): Unable to determine file size');
    }
  });
  // extract ports from remote readable/writable streams for Comlink.transfer
  const readablePorts = remoteWritableStreams.map(
    ({ readablePort }) => readablePort,
  );
  const writablePorts = remoteReadableStreams.map(
    ({ writablePort }) => writablePort,
  );
  // enter worker thread
  const remote = await new RemoteAPI();
  /**
   * PenumbraWorkerAPI.decrypt calls require('./decrypt').decrypt()
   * from the worker thread and starts reading the input stream from
   * [remoteWritableStream.writable]
   */
  const promise = remote.decrypt(
    options,
    ids,
    sizes,
    transfer(readablePorts, readablePorts),
    transfer(writablePorts, writablePorts),
  );
  promise.catch((error) => {
    logger.error(
      `penumbra.decrypt() failed to set up the decryption job on the worker: ${error}`,
    );
  });

  // construct output files with corresponding remote readable streams
  const readables: PenumbraEncryptedFile[] = remoteReadableStreams.map(
    (_, i): PenumbraEncryptedFile => {
      // Create a `TransformStream` which sends chunks to the worker, and receives chunks back.
      const { writable } = remoteWritableStreams[i];
      const { readable } = remoteReadableStreams[i];
      const remoteTransformStream: TransformStream<Uint8Array, Uint8Array> = {
        // The `WritableStream` we write chunks to by reading from `files[i].stream`. Chunks are sent to the Worker.
        writable,
        // The `ReadableStream` we read chunks from and ultimately pass to the library consumer. Chunks are received from the Worker.
        readable,
      };

      // Create a `TransformStream` which breaks huge chunks into smaller chunks. Otherwise, it will basically "one-shot" slowly.
      const chunkSizeTransformStream = createChunkSizeTransformStream();

      // Return a `ReadableStream` which is transforming through the web worker
      const stream = files[i].stream
        .pipeThrough(chunkSizeTransformStream)
        .pipeThrough(remoteTransformStream);

      return {
        ...files[i],
        size: sizes[i],
        id: ids[i],
        stream,
      };
    },
  );
  return readables;
}

/**
 * penumbra.decrypt() API
 *
 * Decrypts files encrypted by penumbra.encrypt()
 *
 * ```ts
 * await penumbra.decrypt(options, ...files);
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
 * @param files - Files
 * @returns Files
 */
export function decrypt(
  options: PenumbraDecryptionInfo,
  ...files: PenumbraEncryptedFile[]
): Promise<PenumbraFile[]> {
  return Promise.all(
    files.map(async (file) => (await decryptJob(options, file))[0]),
  );
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
  setWorkerLocation,
};

export default penumbra;
/* eslint-enable max-lines */
