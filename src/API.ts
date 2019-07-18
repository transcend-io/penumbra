import { saveAs } from 'file-saver';
import { createWriteStream } from 'streamsaver';

// Types
import {
  compression,
  PenumbraAPI,
  PenumbraFile,
  PenumbraFiles,
  RemoteResourceWithoutFile,
} from './types';

// Local
import fetchMany from './fetchMany';
import { blobCache, isViewableText, spreadify } from './utils';
import { getWorkers } from './workers';

const workers = getWorkers();

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

/** Detect if a PenumbraFiles instance is a File[] list */
function isFileList(data: PenumbraFiles): boolean {
  return (
    !(data instanceof ReadableStream) &&
    [...{ ...data, ...spreadify }].every((item) => item instanceof File)
  );
}

/**
 * Get the only file/stream from a single-stream PenumbraFiles.
 * Otherwise, it returns false
 */
function getFirstStream(data: PenumbraFiles): PenumbraFile {
  return data instanceof ReadableStream
    ? data
    : ((data as unknown) as File[])[0];
}

/** Save files retrieved by Penumbra */
async function save(data: PenumbraFiles, fileName?: string): Promise<void> {
  if (isFileList(data)) {
    // data as File[]
    // TODO: Use streaming zip through conflux
    const archive = await zip(data);
    archive.pipeTo(createWriteStream(fileName || `${DEFAULT_FILENAME}.zip`));
  }
  if (data instanceof ReadableStream) {
    // data as ReadableStream
    data.pipeTo(createWriteStream(fileName || DEFAULT_FILENAME));
  }
  // data as File[1]
  const file: File = (data as File[])[0];
  saveAs(file, file.name);
}

/** Load files retrieved by Penumbra into memory as a Blob */
async function getBlob(data: PenumbraFiles): Promise<Blob> {
  if (isFileList(data)) {
    // data as File[]
    return getBlob(await zip(data));
  }
  // data as File[1] | ReadableStream
  return new Response(getFirstStream(data)).blob();
}

/** Get file text (if content is viewable) or URI (if content is not viewable) */
async function getTextOrURI(data: PenumbraFiles): Promise<string> {
  const fileList = isFileList(data);
  const stream = getFirstStream(data);
  const { type } = stream as File;
  if (!fileList && type && isViewableText(type)) {
    return new Response(stream as PenumbraFile).text();
  }
  const uri = URL.createObjectURL(
    await getBlob(isFileList(data) ? await zip(data) : data),
  );
  const cache = blobCache.get();
  cache.push(new URL(uri));
  blobCache.set(cache);
  return uri;
}

const API: PenumbraAPI = { get, save, getBlob, getTextOrURI, zip };

export default API;
