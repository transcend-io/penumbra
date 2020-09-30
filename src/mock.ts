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
      write(): void {}, // eslint-disable-line @typescript-eslint/no-empty-function, no-empty
      /** Close zip writer */
      close(): void {}, // eslint-disable-line @typescript-eslint/no-empty-function, no-empty
      conflux: function Writer() {} as any, // eslint-disable-line @typescript-eslint/no-empty-function, no-empty
      writer: {} as any, // eslint-disable-line no-empty
      controller: new AbortController(),
      aborted: false,
    } as any) as PenumbraZipWriter),
  setWorkerLocation: async () => undefined,
};

export default MOCK_API;
