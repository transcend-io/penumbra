/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable @typescript-eslint/no-empty-function */
// local
import type { PenumbraAPI } from './types';
import { PenumbraSupportLevel } from './enums';
import { PenumbraZipWriter } from './zip';
import { asJobID } from './job-id';

const supported = (): PenumbraSupportLevel => -0;
supported.levels = PenumbraSupportLevel;

const MOCK_API: PenumbraAPI = {
  get: () => Promise.resolve([]),
  save: () => Promise.resolve(),
  supported,
  preconnect: () => () => {},
  preload: () => () => {},
  encrypt: () =>
    Promise.resolve({
      stream: new Response(new Blob()).body!,
      size: 0,
      id: asJobID('49e74657-f3b7-4777-994c-5f769a9828c5'),
    }),
  decrypt: () =>
    Promise.resolve({
      stream: new Response(new Blob()).body!,
      id: asJobID('55889332-22e6-420c-91e8-7cc2a6b9106e'),
    }),
  getDecryptionInfo: () =>
    Promise.resolve({
      key: new Uint8Array(32).fill(1),
      iv: new Uint8Array(12).fill(1),
      authTag: new Uint8Array(16).fill(1),
    }),
  getBlob: () => Promise.resolve(new Blob()),
  getTextOrURI: () => [
    Promise.resolve({ data: 'test', type: 'text', mimetype: 'text/plain' }),
  ],
  saveZip: () =>
    ({
      /** Add PenumbraFiles to zip */
      write(): void {},
      /** Close zip writer */
      close(): void {},
      conflux: function Writer() {},
      writer: {},
      controller: new AbortController(),
      aborted: false,
    }) as unknown as PenumbraZipWriter,
  setLogLevel: () => {},
};

export { MOCK_API };
