/**
 * Penumbra
 * Fetch and decrypt files in the browser using whatwg streams and web workers.
 * @module penumbra
 * @author Transcend Inc. <https://transcend.io>
 * @license Apache-2.0
 */

// exports
import penumbra from './api';

import './transferHandlers/penumbra-events';
import type { PenumbraAPI } from './types';

import { PenumbraEvent } from './event';

export * from './types';

/** Extend global Window */
declare global {
  /** Extend self */
  interface Window {
    /** self.penumbra interface */
    penumbra?: PenumbraAPI;
  }
}

self.penumbra = penumbra;

self.dispatchEvent(
  new PenumbraEvent('penumbra-ready', { detail: { penumbra } }),
);

export { PenumbraSupportLevel } from './enums';
export { default as MOCK_API } from './mock';
export { default as penumbra } from './api';
