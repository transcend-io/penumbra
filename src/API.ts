// Remote
import * as Comlink from 'comlink';
import { RemoteReadableStream, RemoteWritableStream } from 'remote-web-streams';
import { MessagePortSink } from 'remote-web-streams/dist/types/writable';

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
  const { getWorkers } = await import('./workers');
  const workers = await getWorkers();
  const DecryptionChannel = workers.Decrypt.comlink;
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
    await thread.get(Comlink.transfer(writablePorts, writablePorts), resources);
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
    await archive.pipeTo(
      createStreamSaver(fileName || `${DEFAULT_FILENAME}.zip`),
    );
    return undefined;
  }

  const file: PenumbraFile = 'stream' in data ? data : data[0];
  console.warn('TODO: get filename extension');
  const singleFileName = fileName || file.filePrefix || DEFAULT_FILENAME;

  // Write a single readable stream to file
  file.stream.pipeTo(createStreamSaver(singleFileName));
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
): Promise<Blob> {
  if ('length' in data && data.length > 1) {
    return getBlob(await zip(data));
  }

  let file: ReadableStream;
  if (data instanceof ReadableStream) {
    file = data;
  } else {
    file = ('stream' in data ? data : data[0]).stream;
  }

  return new Response(file).blob();
}

/**
 * Get file text (if content is viewable) or URI (if content is not viewable)
 *
 * @param data - The data to get the text of
 * @returns The text itself or a URI encoding the image if applicable
 */
async function getTextOrURI(
  data: PenumbraFile[],
  mimetype: string = data[0].mimetype,
): Promise<{
  /** Data type */
  type: 'text' | 'uri';
  /** Data */
  data: string;
}> {
  if (data.length === 1 && isViewableText(mimetype)) {
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

const penumbra: PenumbraAPI = { get, save, getBlob, getTextOrURI, zip };

export default penumbra;
