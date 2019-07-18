import { PenumbraAPI, PenumbraFiles, RemoteResource } from './types';

const API: PenumbraAPI = {
  get: async (resources: RemoteResource[]) =>
    ['', ''].map((s) => new File([s], s)),
  save: async () => undefined,
  getBlob: async () => new Blob(['']),
  getTextOrURI: async () => '',
  zip: async () => new ReadableStream(),
};

export default API;
