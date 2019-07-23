// Types
import {
  compression,
  PenumbraAPI,
  PenumbraDecryptionWorkerAPI,
  RemoteResourceWithoutFile,
} from './types';

// Local
import { blobCache, isViewableText } from './utils';

// const workers = await getWorkers();

/** Retrieve and decrypt files */
async function get(
  ...resources: RemoteResourceWithoutFile[]
): Promise<ReadableStream[]> {
  if (arguments.length === 0) {
    console.warn('penumbra.get() called without arguments -- using test data');
    // eslint-disable-next-line no-param-reassign
    resources = [
      {
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        filePrefix: 'NYT',
        mimetype: 'text/plain',
        decryptionOptions: {
          key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
          iv: '6lNU+2vxJw6SFgse',
          authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
      },
    ];
  }
  const { getWorkers } = await import('./workers');
  // type PenumbraWorkerDebugView = Window & { workers?: PenumbraWorkers };
  // eslint-disable-next-line no-restricted-globals
  const DecryptionChannel = (await getWorkers()).Decrypt.comlink;
  const text = new DecryptionChannel().then(async (thread: any) => {
    // PenumbraDecryptionWorkerAPI) => {
    // eslint-disable-next-line new-cap
    console.log('in worker');
    const responses = await thread.fetchMany(...resources);
    responses.map(async (response: ReadableStream) =>
      new Response(response).text(),
    );
    console.log(responses);
    return responses;
  });
  const res = await text;
  console.log('penumbra.get() called');
  console.log(res);
  return ['', ''].map(() => new ReadableStream());
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
  const { createWriteStream } = await import('streamsaver');

  // Write a single readable stream to file
  if (data instanceof ReadableStream) {
    data.pipeTo(createWriteStream(fileName));
    return undefined;
    // return saveAs(await new Response(data).blob(), fileName);
  }

  // Zip a list of files
  // TODO: Use streaming zip through conflux
  if ('length' in data && data.length > 1) {
    const archive = await zip(data);
    await archive.pipeTo(
      createWriteStream(
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
