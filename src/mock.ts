// local
import { PenumbraAPI, PenumbraSupportLevel } from './types';

const supported = (): PenumbraSupportLevel => -0;
supported.levels = PenumbraSupportLevel;

const MOCK_API: PenumbraAPI = {
  get: async () => [],
  save: async () => undefined,
  supported,
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
