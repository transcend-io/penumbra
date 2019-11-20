// local
import { PenumbraAPI } from './types';

const MOCK_API: PenumbraAPI = {
  get: async () => [],
  save: async () => undefined,
  encrypt: async () => [],
  decrypt: async () => [],
  getDecryptionInfo: async () => ({
    key: 'test',
    iv: 'test',
    authTag: 'test',
  }),
  getBlob: async () => new Blob(),
  getTextOrURI: () => [
    Promise.resolve({ data: 'test', type: 'text', mimetype: 'text/plain' }),
  ],
  zip: async () => new ReadableStream(),
  setWorkerLocation: async () => undefined,
};

export default MOCK_API;
