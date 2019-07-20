import { saveAs } from 'file-saver';
import { createWriteStream } from 'streamsaver';

// Types
import { isFileList } from './typeGuards';
import {
  compression,
  PenumbraFile,
  PenumbraFiles,
  RemoteResourceWithoutFile,
} from './types';

// Local
import { blobCache, isViewableText } from './utils';
// import { getWorkers } from './workers';

// const workers = getWorkers();

/** Retrieve and decrypt files */
async function get(
  ...resources: RemoteResourceWithoutFile[]
): Promise<PenumbraFiles> {
  // workers.decrypt.comlink;
  console.error('penumbra.get() is unimplemented');
  return ['', ''].map((s) => new File([s], s));
}

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
  // Write a readable stream to file
  if (data instanceof ReadableStream) {
    data.pipeTo(createWriteStream(fileName));
    return saveAs(await new Response(data).blob(), fileName);
  }

  // Zip a list of files
  // TODO: Use streaming zip through conflux
  if (data.length > 1) {
    const archive = await zip(data);
    await archive.pipeTo(
      createWriteStream(fileName || `${DEFAULT_FILENAME}.zip`),
    );
    return undefined;
  }
  return saveAs(data[0], data[0].name);
}

/**
 * Load files retrieved by Penumbra into memory as a Blob
 *
 * @param data - The data to load
 * @returns A blob of the data
 */
async function getBlob(data: PenumbraFiles): Promise<Blob> {
  if (isFileList(data)) {
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
): Promise<{
  /** Data type */
  type: 'text' | 'uri';
  /** Data */
  data: string;
}> {
  const fileList = isFileList(data);
  if (fileList) {
    const dataAsList = data as File[];
    const { type } = dataAsList[0];
    if (type && isViewableText(type)) {
      return {
        type: 'text',
        data: await new Response(dataAsList[0]).text(),
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

export default { get, save, getBlob, getTextOrURI, zip };
