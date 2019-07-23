import { saveAs } from 'file-saver';
import { createWriteStream } from 'streamsaver';

// Types
import { isStreamList } from './typeGuards';
import {
  compression,
  PenumbraAPI,
  PenumbraDecryptionWorkerAPI,
  PenumbraFile,
  PenumbraFiles,
  RemoteResourceWithoutFile,
} from './types';

// Local
import { blobCache, isViewableText } from './utils';
import { getWorkers } from './workers';

// const workers = await getWorkers();

/** Retrieve and decrypt files */
async function get(
  ...resources: RemoteResourceWithoutFile[]
): Promise<PenumbraFiles> {
  // type PenumbraWorkerDebugView = Window & { workers?: PenumbraWorkers };
  // eslint-disable-next-line no-restricted-globals
  const DecryptionChannel = (await getWorkers()).Decrypt.comlink;
  const text = await new DecryptionChannel().then((thread) =>
    (thread as PenumbraDecryptionWorkerAPI).fetchMany(...resources),
  );
  console.log('penumbra.get() called');
  console.log(text);
  return ['', ''].map((s) => new File([s], s));
}

get.TEST = {
  url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
  filePrefix: 'NYT',
  mimetype: 'text/plain',
  decryptionOptions: {
    key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
    iv: '6lNU+2vxJw6SFgse',
    authTag: 'gadZhS1QozjEmfmHLblzbg==',
  },
};

/** Zip files retrieved by Penumbra */
async function zip(
  data: PenumbraFiles,
  compressionLevel: number = compression.store,
): Promise<ReadableStream> {
  console.error('penumbra.zip() is unimplemented');
  return new ReadableStream();
}

const DEFAULT_FILENAME = 'download';

/**
 * Get the only file/stream from a single-stream PenumbraFiles.
 * Otherwise, it returns false
 */
function getFirstStream(data: PenumbraFiles): PenumbraFile {
  return data instanceof ReadableStream ? data : data[0];
}

/**
 * Save files retrieved by Penumbra
 *
 * @param data - The data files to save
 * @param fileName - The name of the file to save to
 * @returns A promise that saves the files
 */
async function save(
  data: PenumbraFiles,
  fileName: string = DEFAULT_FILENAME,
): Promise<void> {
  // Write a single readable stream to file
  if (data instanceof ReadableStream) {
    data.pipeTo(createWriteStream(fileName));
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

  return saveAs(await new Response(getFirstStream(data)).blob(), fileName);
}

/**
 * Load files retrieved by Penumbra into memory as a Blob
 *
 * @param data - The data to load
 * @returns A blob of the data
 */
async function getBlob(data: PenumbraFiles): Promise<Blob> {
  if (isStreamList(data)) {
    return getBlob(await zip(data));
  }
  return new Response(getFirstStream(data)).blob();
}

/**
 * Get file text (if content is viewable) or URI (if content is not viewable)
 *
 * @param data - The data to get the text of
 * @returns The text itself or a URI encoding the image if applicable
 */
async function getTextOrURI(
  data: PenumbraFiles,
  mimetype: string = 'application/octet-stream',
): Promise<{
  /** Data type */
  type: 'text' | 'uri';
  /** Data */
  data: string;
}> {
  const streamList = isStreamList(data);
  if (!streamList) {
    const dataAsList = data as ReadableStream;
    if (isViewableText(mimetype)) {
      return {
        type: 'text',
        data: await new Response(dataAsList).text(),
      };
    }
  }

  const uri = URL.createObjectURL(
    await getBlob(fileList ? await zip(data) : data),
  );
  const cache = blobCache.get();
  cache.push(new URL(uri));
  blobCache.set(cache);
  return { type: 'uri', data: uri };
}

const penumbra: PenumbraAPI = { get, save, getBlob, getTextOrURI, zip };

export default penumbra;
