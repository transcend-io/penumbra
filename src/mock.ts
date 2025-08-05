/* eslint-disable require-await */

// local
import { PenumbraAPI } from './types';
import { PenumbraSupportLevel } from './enums';
import { PenumbraZipWriter } from './zip';

const supported = (): PenumbraSupportLevel => -0;
supported.levels = PenumbraSupportLevel;

const MOCK_API: PenumbraAPI = {
  get: async () => [],
  save: () => Promise.resolve(),
  supported,
  preconnect: () => () => {},
  preload: () => () => {},
  encrypt: async () => ({
    stream: new Response(new Blob()).body!,
    size: 0,
    id: 2,
  }),
  decrypt: async () => ({
    stream: new Response(new Blob()).body!,
    id: 1,
  }),
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
    ({
      /** Add PenumbraFiles to zip */
      write(): void {},
      /** Close zip writer */
      close(): void {},
      conflux: function Writer() {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      writer: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      controller: new AbortController(),
      aborted: false,
    }) as any as PenumbraZipWriter, // eslint-disable-line @typescript-eslint/no-explicit-any
  setWorkerLocation: async () => undefined,
};

export default MOCK_API;

/* eslint-enable require-await */
