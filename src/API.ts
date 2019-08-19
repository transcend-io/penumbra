// Remote
import { transfer } from 'comlink';
import { RemoteReadableStream } from 'remote-web-streams';

// Types

// Local
import {
  Compression,
  // PenumbraDecryptionWorkerAPI,
  PenumbraDecryptionWorkerAPI,
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
  const workers = await getWorkers();
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
    return readables;
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
  save,
  getBlob,
  getTextOrURI,
  zip,
  setWorkerLocation,
};

export default penumbra;
