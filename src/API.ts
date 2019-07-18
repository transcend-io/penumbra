// Types
import { PenumbraAPI, PenumbraFiles, RemoteResourceWithoutFile } from './types';

// Local
import setWorkerLocation, { getWorkerLocation, getWorkers } from './workers';

const workers = getWorkers();

/** Retrieve and decrypt files */
async function get(
  ...resources: RemoteResourceWithoutFile[]
): Promise<PenumbraFiles> {
  return ['', ''].map((s) => new File([s], s));
}

/** Save files retrieved by Penumbra */
async function save(data: PenumbraFiles): Promise<void> {}

/** Load files retrieved by Penumbra into memory as a Blob */
async function getBlob(data: PenumbraFiles): Promise<Blob> {
  return new Blob(['']);
}

/** Get file text (if content is viewable) or URI (if content is not viewable) */
async function getTextOrURI(data: PenumbraFiles): Promise<string> {
  return '';
}

/** Zip files retrieved by Penumbra */
async function zip(
  data: PenumbraFiles,
  compressionLevel: number,
): Promise<ReadableStream> {
  return new ReadableStream();
}

const API: PenumbraAPI = { get, save, getBlob, getTextOrURI, zip };

export default API;
