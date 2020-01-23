/* eslint-disable max-lines */
// Remote
import { transfer } from 'comlink';
import { RemoteReadableStream, RemoteWritableStream } from 'remote-web-streams';
import { toWebReadableStream } from 'web-streams-node';

// Local
import {
  EncryptionCompletionEmit,
  PenumbraDecryptionInfo,
  PenumbraEncryptedFile,
  PenumbraEncryptionOptions,
  PenumbraFile,
  PenumbraFileWithID,
  PenumbraTextOrURI,
  PenumbraWorkerAPI,
  RemoteResource,
} from './types';
import { blobCache, intoStreamOnlyOnce, isViewableText } from './utils';
import { getWorker, setWorkerLocation } from './workers';

const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

const writableStreamsSupported = 'WritableStream' in self;

/**
 * Retrieve and decrypt files
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
async function get(...resources: RemoteResource[]): Promise<PenumbraFile[]> {
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
        stream: stream.readable,
        path,
        // derived path is overridden if PenumbraFile contains path
        ...resources[i],
      };
    });
    const writablePorts = remoteStreams.map(({ writablePort }) => writablePort);
    new DecryptionChannel().then(async (thread: PenumbraWorkerAPI) => {
      await thread.get(transfer(writablePorts, writablePorts), resources);
    });
    return readables as PenumbraFile[];
  }

  // let decryptedFiles: PenumbraFile[] = await new DecryptionChannel().then(
  //   async (thread: PenumbraWorkerAPI) => {
  //     const buffers = await thread.getBuffers(resources);
  //     decryptedFiles = buffers.map((stream, i) => {
  //       const { url } = resources[i];
  //       resolver.href = url;
  //       const path = resolver.pathname;
  //       return {
  //         stream,
  //         path,
  //         ...resources[i],
  //       };
  //     });
  //     return decryptedFiles;
  //   },
  // );
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
        stream: await new Response(
          await fetchAndDecrypt(resource),
        ).arrayBuffer(),
        ...resource,
      } as PenumbraFile;
    }),
  );
  return decryptedFiles;
}

/** Compression levels */
export enum Compression {
  /** No compression */
  Store = 0,
  /** Low compression */
  Low = 1,
  /** Medium compression */
  Medium = 2,
  /** High compression */
  High = 3,
}

/** Zip files retrieved by Penumbra */
async function zip(
  data: PenumbraFile[] | PenumbraFile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compressionLevel: number = Compression.Store,
): Promise<ReadableStream> {
  throw new Error('penumbra.zip() is unimplemented');
  // return new ReadableStream();
}

const DEFAULT_FILENAME = 'download';
const DEFAULT_MIME_TYPE = 'application/octet-stream';
const ZIP_MIME_TYPE = 'application/zip';
/** Maximum allowed resource size for encrypt/decrypt on the main thread */
const MAX_ALLOWED_SIZE_MAIN_THREAD = 16 * 1024 * 1024; // 16 MiB

/**
 * Save files retrieved by Penumbra
 *
 * @param data - The data files to save
 * @param fileName - The name of the file to save to
 * @returns A promise that saves the files
 */
async function save(data: PenumbraFile[], fileName?: string): Promise<void> {
  const createStreamSaver = (await import('streamsaver')).createWriteStream;
  const { saveAs } = await import('file-saver');

  // Zip a list of files
  // TODO: Use streaming zip through conflux
  if ('length' in data && data.length > 1) {
    const archive = await zip(data);
    return archive.pipeTo(
      createStreamSaver(fileName || `${DEFAULT_FILENAME}.zip`),
    );
  }

  const file: PenumbraFile = 'stream' in data ? data : data[0];
  // TODO: get filename extension with mime.extension()
  const singleFileName = fileName || file.filePrefix || DEFAULT_FILENAME;

  // Write a single readable stream to file
  if (file.stream instanceof ReadableStream) {
    return file.stream.pipeTo(createStreamSaver(singleFileName));
  }
  if (file.stream instanceof ArrayBuffer) {
    return saveAs(
      new Blob([new Uint8Array(file.stream, 0, file.stream.byteLength)]),
      singleFileName,
    );
  }
  return undefined;
}

/**
 * Load files retrieved by Penumbra into memory as a Blob
 *
 * @param data - The data to load
 * @returns A blob of the data
 */
async function getBlob(
  data: PenumbraFile[] | PenumbraFile | ReadableStream,
  type?: string, // = data[0].mimetype
): Promise<Blob> {
  if ('length' in data && data.length > 1) {
    return getBlob(await zip(data), type || ZIP_MIME_TYPE);
  }

  let rs: ReadableStream;
  let fileType: string | undefined;
  if (data instanceof ReadableStream) {
    rs = data;
  } else {
    const file = 'length' in data ? data[0] : data;
    if (file.stream instanceof ArrayBuffer) {
      return new Blob([new Uint8Array(file.stream, 0, file.stream.byteLength)]);
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
const decryptionConfigs = new Map<number, PenumbraDecryptionInfo>();

const trackEncryptionCompletion = (
  searchForID?: string | number,
): Promise<PenumbraDecryptionInfo> =>
  new Promise((complete) => {
    const listener = ({
      type,
      detail: { id, decryptionInfo },
    }: EncryptionCompletionEmit): void => {
      decryptionConfigs.set(id, decryptionInfo);
      if (typeof searchForID !== 'undefined' && `${id}` === `${searchForID}`) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (self.removeEventListener as any)(type, listener);
        complete(decryptionInfo);
      }
    };
    self.addEventListener('penumbra-encryption-complete', listener);
  });

// trackEncryptionCompletion();

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
    return trackEncryptionCompletion(id);
  }
  return decryptionConfigs.get(id) as PenumbraDecryptionInfo;
}

/**
 * Encrypt files
 *
 * ```ts
 * await penumbra.encrypt(options, ...files);
 * // usage example:
 * size = 4096 * 64 * 64;
 * addEventListener('penumbra-progress',(e)=>console.log(e.type, e.detail));
 * addEventListener('penumbra-encryption-complete',(e)=>console.log(e.type, e.detail));
 * file = penumbra.encrypt(null, {stream:intoStream(new Uint8Array(size)), size});
 * let data = [];
 * file.then(async ([encrypted]) => {
 *   console.log('encryption started');
 *   data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
 * });
 */
export async function encrypt(
  options: PenumbraEncryptionOptions | null,
  ...files: PenumbraFile[]
): Promise<PenumbraEncryptedFile[]> {
  // Ensure a file is passed
  if (files.length === 0) {
    throw new Error('penumbra.encrypt() called without arguments');
  }

  // Ensure readable streams
  if (files.some((file) => file.stream instanceof ArrayBuffer)) {
    throw new Error('penumbra.encrypt() only supports ReadableStreams');
  }

  // collect file sizes and assign encryption job IDs for completion tracking
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
      (thread) =>
        thread.encrypt(
          options,
          ids,
          sizes,
          transfer(readablePorts, readablePorts),
          transfer(writablePorts, writablePorts),
        ),
    );

    // encryption jobs submitted and still processing
    remoteWritableStreams.forEach((remoteWritableStream, i) => {
      // pipe input files into remote writable streams for worker
      (files[i].stream instanceof ReadableStream
        ? files[i].stream
        : toWebReadableStream(intoStreamOnlyOnce(files[i].stream))
      ).pipeTo(remoteWritableStream.writable);
    });

    // construct output files with corresponding remote readable streams
    const readables = remoteReadableStreams.map(
      (stream, i): PenumbraEncryptedFile => ({
        ...files[i],
        // iv: metadata[i].iv,
        stream: stream.readable as ReadableStream,
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
        const { iv, stream } = encryptFile(options, file, file.size as number);
        return {
          stream,
          ...file,
          ...options,
          iv,
        };
      },
    ),
  );
  return encryptedFiles;
}

/**
 * Decrypt files encrypted by penumbra.encrypt()
 *
 * ```ts
 * await penumbra.decrypt(options, ...files);
 * // usage example:
 * size = 4096 * 64 * 64;
 * addEventListener('penumbra-progress',(e)=>console.log(e.type, e.detail));
 * addEventListener('penumbra-encryption-complete',(e)=>console.log(e.type, e.detail));
 * file = penumbra.encrypt(null, {stream:intoStream(new Uint8Array(size)), size});
 * let data = [];
 * file.then(async ([encrypted]) => {
 *   console.log('encryption started');
 *   data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
 * });
 */
export async function decrypt(
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
    // collect file sizes and assign encryption job IDs for completion tracking
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
    await new DecryptionChannel().then(async (thread: PenumbraWorkerAPI) => {
      /**
       * PenumbraWorkerAPI.encrypt calls require('./encrypt').encrypt()
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
    // encryption jobs submitted and still processing
    remoteWritableStreams.forEach((remoteWritableStream, i) => {
      // pipe input files into remote writable streams for worker
      (files[i].stream instanceof ReadableStream
        ? files[i].stream
        : toWebReadableStream(intoStreamOnlyOnce(files[i].stream))
      ).pipeTo(remoteWritableStream.writable);
    });
    // construct output files with corresponding remote readable streams
    const readables: PenumbraEncryptedFile[] = remoteReadableStreams.map(
      (stream, i): PenumbraEncryptedFile => ({
        ...files[i],
        stream: stream.readable as ReadableStream,
        size: sizes[i],
        id: ids[i],
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
  const { decrypt: decryptFile } = await import('./decrypt');
  const decryptedFiles: PenumbraFile[] = await Promise.all(
    files.map(async (file) => decryptFile(options, file, file.size as number)),
  );
  return decryptedFiles;
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
      const { mimetype } = file;
      if (isViewableText(mimetype)) {
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
  getBlob,
  getTextOrURI,
  zip,
  setWorkerLocation,
};

export default penumbra;
