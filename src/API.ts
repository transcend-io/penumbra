/* eslint-disable max-lines */
// Remote
import { transfer } from 'comlink';
import {
  RemoteReadableStream,
  RemoteWritableStream,
} from '@transcend-io/remote-web-streams';
import streamSaver from 'streamsaver';
import mime from 'mime-types';
import {
  ReadableStream,
  WritableStreamIsNative,
  WritableStreamPonyfill,
} from './streams';

// Local
import {
  JobCompletionEmit,
  PenumbraDecryptionInfo,
  PenumbraEncryptedFile,
  PenumbraEncryptionOptions,
  PenumbraFile,
  PenumbraFileWithID,
  PenumbraTextOrURI,
  PenumbraWorkerAPI,
  RemoteResource,
  ZipOptions,
} from './types';
import { PenumbraZipWriter } from './zip';
import { blobCache, isNumber, isViewableText } from './utils';
import { getWorker, setWorkerLocation } from './workers';
import { supported } from './ua-support';

const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

const writableStreamsSupported = 'WritableStream' in self;

const { createWriteStream } = streamSaver;
if (!WritableStreamIsNative) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (streamSaver as any).WritableStream = WritableStreamPonyfill;
}

/**
 * Retrieve and decrypt files (batch job)
 */
async function getJob(...resources: RemoteResource[]): Promise<PenumbraFile[]> {
  if (resources.length === 0) {
    throw new Error('penumbra.get() called without arguments');
  }
  if (writableStreamsSupported) {
    // WritableStream constructor supported
    const worker = await getWorker();
    const DecryptionChannel = worker.comlink;
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
    new DecryptionChannel().then((thread: PenumbraWorkerAPI) => {
      thread.get(transfer(writablePorts, writablePorts), resources);
    });
    return readables as PenumbraFile[];
  }

  const { default: fetchAndDecrypt } = await import('./fetchAndDecrypt');
  /**
   * Fetch remote files from URLs, decipher them (if encrypted),
   * fully buffer the response, and return ArrayBuffer[]
   */
  const decryptedFiles: PenumbraFile[] = await Promise.all(
    resources.map(async (resource) => {
      if (!('url' in resource)) {
        throw new Error('penumbra.get(): RemoteResource missing URL');
      }
      return {
        ...resource,
        stream: new Response(await fetchAndDecrypt(resource)).body,
      } as PenumbraFile;
    }),
  );
  return decryptedFiles;
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
 *  new Response(stream).text()
 * ));
 *
 * // Buffer a response & read as text
 * await new Response((await penumbra.get(resource))[0].stream).text();
 *
 * // Example call with an included resource
 * await penumbra.get({
 *   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
 *   filePrefix: 'NYT',
 *   mimetype: 'text/plain',
 *   decryptionOptions: {
 *     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
 *     iv: '6lNU+2vxJw6SFgse',
 *     authTag: 'gadZhS1QozjEmfmHLblzbg==',
 *   },
 * });
 * ```
 */
export function get(...resources: RemoteResource[]): Promise<PenumbraFile[]> {
  return Promise.all(
    resources.map(async (resource) => (await getJob(resource))[0]),
  );
}

const DEFAULT_FILENAME = 'download';
const DEFAULT_MIME_TYPE = 'application/octet-stream';
/** Maximum allowed resource size for encrypt/decrypt on the main thread */
const MAX_ALLOWED_SIZE_MAIN_THREAD = 32 * 1024 * 1024; // 32 MiB

/**
 * Save a zip containing files retrieved by Penumbra
 *
 * @param options - ZipOptions
 * @returns PenumbraZipWriter class instance
 */
function saveZip(options?: ZipOptions): PenumbraZipWriter {
  return new PenumbraZipWriter(options);
}

/**
 * Save files retrieved by Penumbra
 *
 * @param data - The data files to save
 * @param fileName - The name of the file to save to
 * @returns AbortController
 */
function save(
  files: PenumbraFile[],
  fileName?: string,
  controller = new AbortController(),
): AbortController {
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
    writer.write(...files);
    return controller;
  }

  // Single file
  const file: PenumbraFile = 'stream' in files ? files : files[0];
  const [
    filename,
    extension = file.mimetype ? mime.extension(file.mimetype) : '',
  ] = (fileName || file.filePrefix || DEFAULT_FILENAME)
    .split(/(\.\w+\s*$)/) // split filename extension
    .filter(Boolean); // filter empty matches

  const singleFileName = `${filename}${extension}`;

  const { signal } = controller;

  // Write a single readable stream to file
  file.stream.pipeTo(createWriteStream(singleFileName), {
    signal,
  });

  return controller;
}

/**
 * Load files retrieved by Penumbra into memory as a Blob
 *
 * @param data - The data to load
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
const decryptionConfigs = new Map<string | number, PenumbraDecryptionInfo>();

const trackJobCompletion = (
  searchForID: string | number,
): Promise<PenumbraDecryptionInfo> =>
  new Promise((complete) => {
    const listener = ({
      type,
      detail: { id, decryptionInfo },
    }: JobCompletionEmit): void => {
      decryptionConfigs.set(id, decryptionInfo);
      if (typeof searchForID !== 'undefined' && `${id}` === `${searchForID}`) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (self.removeEventListener as any)(type, listener);
        complete(decryptionInfo);
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
 */
export async function getDecryptionInfo(
  file: PenumbraEncryptedFile,
): Promise<PenumbraDecryptionInfo> {
  const { id } = file;
  if (!decryptionConfigs.has(id)) {
    // decryption config not yet received. waiting for event with promise
    return trackJobCompletion(id);
  }
  return decryptionConfigs.get(id) as PenumbraDecryptionInfo;
}

/**
 * Encrypt files (batch job)
 */
async function encryptJob(
  options: PenumbraEncryptionOptions | null,
  ...files: PenumbraFile[]
): Promise<PenumbraEncryptedFile[]> {
  // Ensure a file is passed
  if (files.length === 0) {
    throw new Error('penumbra.encrypt() called without arguments');
  }

  // collect file sizes and assign job IDs for completion tracking
  const ids: number[] = [];
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

  // We stream the encryption if supported by the browser
  if (writableStreamsSupported) {
    // WritableStream constructor supported
    const worker = await getWorker();
    const EncryptionChannel = worker.comlink;
    const remoteReadableStreams = files.map(() => new RemoteReadableStream());
    const remoteWritableStreams = files.map(() => new RemoteWritableStream());

    // extract ports from remote readable/writable streams for Comlink.transfer
    const readablePorts = remoteWritableStreams.map(
      ({ readablePort }) => readablePort,
    );
    const writablePorts = remoteReadableStreams.map(
      ({ writablePort }) => writablePort,
    );

    // enter worker thread and grab the metadata
    await (new EncryptionChannel() as Promise<PenumbraWorkerAPI>).then(
      /**
       * PenumbraWorkerAPI.encrypt calls require('./encrypt').encrypt()
       * from the worker thread and starts reading the input stream from
       * [remoteWritableStream.writable]
       */
      (thread) => {
        thread.encrypt(
          options,
          ids,
          sizes,
          transfer(readablePorts, readablePorts),
          transfer(writablePorts, writablePorts),
        );
      },
    );

    // encryption jobs submitted and still processing
    remoteWritableStreams.forEach((remoteWritableStream, i) => {
      files[i].stream.pipeTo(remoteWritableStream.writable);
    });

    // construct output files with corresponding remote readable streams
    const readables = remoteReadableStreams.map(
      (stream, i): PenumbraEncryptedFile => ({
        ...files[i],
        // iv: metadata[i].iv,
        stream: stream.readable,
        size: sizes[i],
        id: ids[i],
      }),
    );
    return readables;
  }

  // throw new Error(
  //   "Your browser doesn't support streaming encryption. Buffered encryption is not yet supported.",
  // );

  const filesWithIds = files as PenumbraFileWithID[];

  let totalSize = 0;
  filesWithIds.forEach(({ size = 0 }) => {
    totalSize += size;
    if (totalSize > MAX_ALLOWED_SIZE_MAIN_THREAD) {
      console.error(`Your browser doesn't support streaming encryption.`);
      throw new Error(
        'penumbra.encrypt(): File is too large to encrypt without writable streams',
      );
    }
  });
  const { default: encryptFile } = await import('./encrypt');
  const encryptedFiles = await Promise.all(
    filesWithIds.map(
      (file): PenumbraEncryptedFile => {
        const { stream } = encryptFile(options, file, file.size as number);
        return {
          ...file,
          ...options,
          stream,
        };
      },
    ),
  );
  return encryptedFiles;
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
 */
async function decryptJob(
  options: PenumbraDecryptionInfo,
  ...files: PenumbraEncryptedFile[]
): Promise<PenumbraFile[]> {
  if (files.length === 0) {
    throw new Error('penumbra.decrypt() called without arguments');
  }
  if (writableStreamsSupported) {
    // WritableStream constructor supported
    const worker = await getWorker();
    const DecryptionChannel = worker.comlink;
    const remoteReadableStreams = files.map(() => new RemoteReadableStream());
    const remoteWritableStreams = files.map(() => new RemoteWritableStream());
    const ids: number[] = [];
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
    await new DecryptionChannel().then((thread: PenumbraWorkerAPI) => {
      /**
       * PenumbraWorkerAPI.decrypt calls require('./decrypt').decrypt()
       * from the worker thread and starts reading the input stream from
       * [remoteWritableStream.writable]
       */
      thread.decrypt(
        options,
        ids,
        sizes,
        transfer(readablePorts, readablePorts),
        transfer(writablePorts, writablePorts),
      );
    });
    // decryption jobs submitted and still processing
    remoteWritableStreams.forEach((remoteWritableStream, i) => {
      files[i].stream.pipeTo(remoteWritableStream.writable);
    });
    // construct output files with corresponding remote readable streams
    const readables: PenumbraEncryptedFile[] = remoteReadableStreams.map(
      (stream, i): PenumbraEncryptedFile => ({
        ...files[i],
        size: sizes[i],
        id: ids[i],
        stream: stream.readable,
      }),
    );
    return readables;
  }

  files.forEach(({ size = 0 }) => {
    if (size > MAX_ALLOWED_SIZE_MAIN_THREAD) {
      console.error(`Your browser doesn't support streaming decryption.`);
      throw new Error(
        'penumbra.decrypt(): File is too large to decrypt without writable streams',
      );
    }
  });

  // Buffered worker solution:
  // let decryptedFiles: PenumbraFile[] = await new DecryptionChannel().then(
  //   async (thread: PenumbraWorkerAPI) => {
  //     const buffers = await thread.getBuffers(options, files);
  //     decryptedFiles = buffers.map((stream, i) => ({
  //       stream,
  //       ...files[i],
  //     }));
  //     return decryptedFiles;
  //   },
  // );

  const { default: decryptFile } = await import('./decrypt');
  const decryptedFiles: PenumbraFile[] = files.map((file) =>
    decryptFile(options, file, file.size as number),
  );
  return decryptedFiles;
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
 *
 * @param files - A list of files to get the text of
 * @returns A list with the text itself or a URI encoding the file if applicable
 */
function getTextOrURI(files: PenumbraFile[]): Promise<PenumbraTextOrURI>[] {
  return files.map(
    async (file): Promise<PenumbraTextOrURI> => {
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
    },
  );
}

const penumbra = {
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
