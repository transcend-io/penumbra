// local
import { PenumbraAPI, PenumbraSupportLevel } from './types';
import { PenumbraZipWriter } from './zip';

const supported = (): PenumbraSupportLevel => -0;
supported.levels = PenumbraSupportLevel;

const MOCK_API: PenumbraAPI = {
  get: async () => [],
  save: () => new AbortController(),
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
  saveZip: () =>
    (({
      /** Add PenumbraFiles to zip */
      write(): void {},
      /** Close zip writer */
      close(): void {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      conflux: function Writer() {} as any,
      writer: {} as any,
      controller: new AbortController(),
      aborted: false,
    } as any) as PenumbraZipWriter),
  setWorkerLocation: async () => undefined,
};

export default MOCK_API;
