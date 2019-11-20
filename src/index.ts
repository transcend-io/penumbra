/**
 *
 * ## Penumbra
 * A file decryption library for the browser
 *
 * @module penumbra
 */

// exports
import penumbra from './API';
import MOCK_API from './mock';
import './transferHandlers/penumbra-events';
import { PenumbraAPI } from './types';

export * from './types';

export { penumbra, MOCK_API };

import intoStream = require('into-stream');

/** Extend global Window */
declare global {
  /** Extend window.penumbra */
  interface Window {
    /** penumbra interface */
    penumbra?: PenumbraAPI;
    /** TODO: remove debug intoStream global */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intoStream: any;
  }
}

self.intoStream = intoStream;
self.penumbra = penumbra;

self.dispatchEvent(new CustomEvent('penumbra-ready', { detail: { penumbra } }));

/**
 * Get the penumbra from window and ensure it is defined
 *
 * @param mock - Mock penumbra when environment variable `PENUMBRA_MOCK` is true
 * @returns The penumbra API object
 */
export function getPenumbra(
  mock = process.env.PENUMBRA_MOCK === 'true',
): PenumbraAPI {
  // Mock the API
  if (mock) {
    return MOCK_API;
  }

  // Pull off of the window
  const { penumbra: currentPenumbra } = self; // eslint-disable-line no-restricted-globals

  if (!currentPenumbra) {
    throw new Error(
      'Penumbra does not exist on self! Ensure it is loaded in the index.html file',
    );
  }

  return currentPenumbra;
}
