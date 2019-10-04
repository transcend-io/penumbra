// Remote
import { transfer } from 'comlink';
import { RemoteReadableStream, RemoteWritableStream } from 'remote-web-streams';
import { toWebReadableStream } from 'web-streams-node';

// Types

// Local
import {
  Compression,
  PenumbraDecryptionInfo,
  PenumbraDecryptionWorkerAPI,
  PenumbraEncryptedFile,
  PenumbraEncryptionOptions,
  PenumbraEncryptionWorkerAPI,
  PenumbraFile,
  PenumbraTextOrURI,
  RemoteResource,
} from './types';
import { blobCache, isViewableText } from './utils';
import { getWorkers, setWorkerLocation } from './workers';

const resolver = document.createElementNS(
  'http://www.w3.org/1999/xhtml',
  'a',
) as HTMLAnchorElement;

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
  const workers = await getWorkers('decrypt');
  const DecryptionChannel = workers.decrypt.comlink;
  if ('WritableStream' in self) {
    // WritableStream constructor supported
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
    new DecryptionChannel().then(
      async (thread: PenumbraDecryptionWorkerAPI) => {
        await thread.get(transfer(writablePorts, writablePorts), resources);
      },
    );
    return readables as PenumbraFile[];
  }
  let files: PenumbraFile[] = await new DecryptionChannel().then(
    async (thread: PenumbraDecryptionWorkerAPI) => {
      const buffers = await thread.getBuffers(resources);
      files = buffers.map((stream, i) => {
        const { url } = resources[i];
        resolver.href = url;
        const path = resolver.pathname;
        return {
          stream,
          path,
          ...resources[i],
        };
      });
      return files;
    },
  );
  return files;
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

let encryptionJobID = 0;
const decryptionConfigs = new Map<number, PenumbraDecryptionInfo>();
/**
 * Get the decryption config for an encrypted file
 *
 * ```ts
 * penumbra.getDecryptionInfo(file: PenumbraEncryptedFile): Promise<PenumbraDecryptionInfo>
 * ```
 */
function getDecryptionInfo(
  file: PenumbraEncryptedFile,
): PenumbraDecryptionInfo {
  if (!decryptionConfigs.has(file.id)) {
    throw new Error('Unable to find decryption info for file');
  }
  return decryptionConfigs.get(file.id) as PenumbraDecryptionInfo;
}

addEventListener(
  'penumbra-encryption-complete',
  ({ detail: { id, decryptionInfo } }) => {
    console.log(`encryption job #${id} complete`);
    decryptionConfigs.set(id, decryptionInfo);
  },
);

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
  options: PenumbraEncryptionOptions,
  ...files: PenumbraFile[]
): Promise<PenumbraEncryptedFile[]> {
  if (files.length === 0) {
    throw new Error('penumbra.encrypt() called without arguments');
  }
  if (files.some((file) => file.stream instanceof ArrayBuffer)) {
    throw new Error('penumbra.encrypt() only supports ReadableStreams');
  }
  const workers = await getWorkers('encrypt');
  const EncryptionChannel = workers.encrypt.comlink;
  if ('WritableStream' in self) {
    // WritableStream constructor supported
    const remoteReadableStreams = files.map(() => new RemoteReadableStream());
    const remoteWritableStreams = files.map(() => new RemoteWritableStream());
    const ids: number[] = [];
    const sizes: number[] = [];
    files.forEach((file) => {
      // eslint-disable-next-line no-plusplus, no-param-reassign
      ids.push((file.id = encryptionJobID++));
      const { size } = file;
      if (size) {
        sizes.push(size);
      } else {
        throw new Error('penumbra.encrypt(): Unable to determine file size');
      }
    });
    const readablePorts = remoteWritableStreams.map(
      ({ readablePort }) => readablePort,
    );
    const writablePorts = remoteReadableStreams.map(
      ({ writablePort }) => writablePort,
    );
    await new EncryptionChannel().then(
      async (thread: PenumbraEncryptionWorkerAPI) => {
        thread.encrypt(
          options,
          ids,
          sizes,
          transfer(readablePorts, readablePorts),
          transfer(writablePorts, writablePorts),
        );
      },
    );
    remoteWritableStreams.forEach((remoteWritableStream, i) => {
      // eslint-disable-next-line no-plusplus
      (files[i].stream instanceof ReadableStream
        ? files[i].stream
        : toWebReadableStream(files[i].stream)
      ).pipeTo(remoteWritableStream.writable);
    });
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
  throw new Error(
    "Your browser doesn't support streaming encryption. Buffered encryption is not yet supported.",
  );
  /*
  let encryptedFiles: PenumbraEncryptedFile[] = await new EncryptionChannel().then(
    async (thread: PenumbraEncryptionWorkerAPI) => {
      const buffers = await thread.encryptBuffers(options, files);
      encryptedFiles = buffers.map((stream, i) => ({
        stream,
        ...options,
        ...files[i],
      }));
      return encryptedFiles;
    },
  );
  return encryptedFiles;
  */
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
  getDecryptionInfo,
  save,
  getBlob,
  getTextOrURI,
  zip,
  setWorkerLocation,
};

export default penumbra;
