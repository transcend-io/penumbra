/**
 * Penumbra
 * Fetch and decrypt files in the browser using whatwg streams and web workers.
 *
 * @module penumbra
 * @author Transcend Inc. <https://transcend.io>
 * @license Apache-2.0
 */

// exports
import penumbra from './API';
import MOCK_API from './mock';
import './transferHandlers/penumbra-events';
import { PenumbraAPI } from './types';
import { PenumbraSupportLevel } from './enums';
import { PenumbraEvent } from './event';

export * from './types';

export { penumbra, MOCK_API, PenumbraSupportLevel };

/** Extend global Window */
declare global {
  /** Extend self */
  interface Window {
    /** self.penumbra interface */
    penumbra?: PenumbraAPI;
  }
}

self.penumbra = penumbra;

if (self.dispatchEvent && PenumbraEvent) {
  self.dispatchEvent(
    new PenumbraEvent('penumbra-ready', { detail: { penumbra } }),
  );
}
