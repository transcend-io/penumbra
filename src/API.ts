// Types
import { PenumbraAPI, PenumbraFiles, RemoteResourceWithoutFile } from './types';

// Local
import setWorkerLocation, { getWorkerLocation, getWorkers } from '../workers';

const API: PenumbraAPI = {
  get: async (...resources: RemoteResourceWithoutFile[]) =>
    ['', ''].map((s) => new File([s], s)),
  save: async () => undefined,
  getBlob: async () => new Blob(['']),
  getTextOrURI: async () => '',
  zip: async () => new ReadableStream(),
};

export default API;
