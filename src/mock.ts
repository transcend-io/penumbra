/* eslint-disable require-await */

// local
import { PenumbraAPI } from './types';
import { PenumbraSupportLevel } from './enums';
import { PenumbraZipWriter } from './zip';
import { asJobID } from './job-id';

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
    id: asJobID('49e74657-f3b7-4777-994c-5f769a9828c5'),
  }),
  decrypt: async () => ({
    stream: new Response(new Blob()).body!,
    id: asJobID('55889332-22e6-420c-91e8-7cc2a6b9106e'),
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
