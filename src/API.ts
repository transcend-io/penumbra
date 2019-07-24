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
  RemoteResourceWithoutFile,
} from './types';
import { blobCache, isViewableText } from './utils';

// const workers = await getWorkers();

/**
 * Retrieve and decrypt files
 *
 * ```ts
 * // Load a resource and get a ReadableStream
 * await penumbra.get(resource);
 *
 * // Buffer all responses & read them as text
 * await Promise.all((await penumbra.get(resources)).map((stream) =>
 *  new Response(stream).text()
 * ));
 *
 * // Buffer a response & read as an ArrayBuffer
 * await new Response(await penumbra.get(resource)).arrayBuffer();
 * ```
 */
async function get(
  ...resources: RemoteResourceWithoutFile[]
): Promise<ReadableStream[]> {
  if (arguments.length === 0) {
    throw new Error('penumbra.get() called without arguments');
  }
  const { getWorkers } = await import('./workers');
  const workers = await getWorkers();
  const DecryptionChannel = workers.Decrypt.comlink;
  const remoteStreams = resources.map(() => new RemoteReadableStream());
  const readables = remoteStreams.map((stream) => stream.readable);
  const writablePorts = remoteStreams.map((stream) => stream.writablePort);
  new DecryptionChannel().then(async (thread: PenumbraDecryptionWorkerAPI) => {
    await thread.get(Comlink.transfer(writablePorts, writablePorts), resources);
  });
  return readables;
}

/** Zip files retrieved by Penumbra */
async function zip(
  data: ReadableStream[],
  compressionLevel: number = compression.store,
): Promise<ReadableStream> {
  console.error('penumbra.zip() is unimplemented');
  return new ReadableStream();
}

const DEFAULT_FILENAME = 'download';

/**
 * Save files retrieved by Penumbra
 *
 * @param data - The data files to save
 * @param fileName - The name of the file to save to
 * @returns A promise that saves the files
 */
async function save(
  data: ReadableStream[],
  fileName: string = DEFAULT_FILENAME,
): Promise<void> {
  const createStreamSaver = (await import('streamsaver')).createWriteStream;

  // Write a single readable stream to file
  if (data instanceof ReadableStream) {
    data.pipeTo(createStreamSaver(fileName));
    return undefined;
    // return saveAs(await new Response(data).blob(), fileName);
  }

  // Zip a list of files
  // TODO: Use streaming zip through conflux
  if ('length' in data && data.length > 1) {
    const archive = await zip(data);
    await archive.pipeTo(
      createStreamSaver(
        fileName === DEFAULT_FILENAME ? `${DEFAULT_FILENAME}.zip` : fileName,
      ),
    );
    return undefined;
  }

  const { saveAs } = await import('file-saver');
  return saveAs(await new Response(data[0]).blob(), fileName);
}

/**
 * Load files retrieved by Penumbra into memory as a Blob
 *
 * @param data - The data to load
 * @returns A blob of the data
 */
async function getBlob(data: ReadableStream[] | ReadableStream): Promise<Blob> {
  if ('length' in data && data.length > 1) {
    return getBlob([await zip(data)]);
  }

  const stream = data instanceof ReadableStream ? data : data[0];
  return new Response(stream).blob();
}

/**
 * Get file text (if content is viewable) or URI (if content is not viewable)
 *
 * @param data - The data to get the text of
 * @returns The text itself or a URI encoding the image if applicable
 */
async function getTextOrURI(
  data: ReadableStream[],
  mimetype: string = 'application/octet-stream',
): Promise<{
  /** Data type */
  type: 'text' | 'uri';
  /** Data */
  data: string;
}> {
  if (data.length === 1 && isViewableText(mimetype)) {
    return {
      type: 'text',
      data: await new Response(data[0]).text(),
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
