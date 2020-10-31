/* eslint-disable require-jsdoc, @typescript-eslint/no-empty-function, no-empty */
/* tslint-disable no-empty */

// local
import { PenumbraAPI } from './types';
import { PenumbraSupportLevel } from './enums';
import { PenumbraZipWriter } from './zip';

const supported = (): PenumbraSupportLevel => -0;
supported.levels = PenumbraSupportLevel;

const MOCK_API: PenumbraAPI = {
  get: async () => [],
  save: () => new AbortController(),
  supported,
  preconnect: () => () => {},
  preload: () => () => {},
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
      conflux: function Writer() {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      writer: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      controller: new AbortController(),
      aborted: false,
    } as any) as PenumbraZipWriter), // eslint-disable-line @typescript-eslint/no-explicit-any
  setWorkerLocation: async () => undefined,
};

export default MOCK_API;

/* tslint-enable no-empty */
/* eslint-enable require-jsdoc, @typescript-eslint/no-empty-function, no-empty */
