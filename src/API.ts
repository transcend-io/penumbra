// Remote
import { transfer } from 'comlink';
import { RemoteReadableStream } from 'remote-web-streams';

// Types

// Local
import {
  compression,
  PenumbraAPI,
  // PenumbraDecryptionWorkerAPI,
  PenumbraDecryptionWorkerAPI,
  PenumbraFile,
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
 * await Promise.all((await penumbra.get(resources)).map((data: PenumbraFile) =>
 *  new Response(data.stream).text()
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
  if (arguments.length === 0) {
    throw new Error('penumbra.get() called without arguments');
  }
  const workers = await getWorkers();
  const DecryptionChannel = workers.decrypt.comlink;
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
  const writablePorts = remoteStreams.map((stream) => stream.writablePort);
  new DecryptionChannel().then(async (thread: PenumbraDecryptionWorkerAPI) => {
    await thread.get(transfer(writablePorts, writablePorts), resources);
  });
  return readables;
}

/** Zip files retrieved by Penumbra */
async function zip(
  data: PenumbraFile[],
  compressionLevel: number = compression.store,
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

  // Zip a list of files
  // TODO: Use streaming zip through conflux
  if ('length' in data && data.length > 1) {
    const archive = await zip(data);
    return archive.pipeTo(
      createStreamSaver(fileName || `${DEFAULT_FILENAME}.zip`),
    );
  }

  const file: PenumbraFile = 'stream' in data ? data : data[0];
  console.warn('TODO: get filename extension');
  const singleFileName = fileName || file.filePrefix || DEFAULT_FILENAME;

  // Write a single readable stream to file
  return file.stream.pipeTo(createStreamSaver(singleFileName));
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
 * @param data - The data to get the text of
 * @returns The text itself or a URI encoding the image if applicable
 */
async function getTextOrURI(
  data: PenumbraFile[],
): Promise<{
  /** Data type */
  type: 'text' | 'uri';
  /** Data */
  data: string;
}> {
  if (data.length === 1 && isViewableText(data[0].mimetype)) {
    return {
      type: 'text',
      data: await new Response(data[0].stream).text(),
    };
  }

  const uri = URL.createObjectURL(
    await getBlob(data.length > 1 ? await zip(data) : data),
  );
  const cache = blobCache.get();
  cache.push(new URL(uri));
  blobCache.set(cache);
  return { type: 'uri', data: uri };
}

const penumbra: PenumbraAPI = {
  get,
  save,
  getBlob,
  getTextOrURI,
  zip,
  setWorkerLocation,
};

export default penumbra;
