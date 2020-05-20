/**
 * Penumbra
 * Fetch and decrypt files in the browser using whatwg streams and web workers.
 *
 * @module penumbra
 * @author Transcend Inc. <https://transcend.io>
 * @license Apache 2.0
 */

import intoStream from 'into-stream';

// exports
import penumbra from './API';
import MOCK_API from './mock';
import './transferHandlers/penumbra-events';
import { PenumbraAPI, PenumbraSupportLevel } from './types';
import { PenumbraEvent } from './event';

export * from './types';

export { penumbra, MOCK_API, PenumbraSupportLevel };

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

if (self.dispatchEvent && PenumbraEvent) {
  self.dispatchEvent(
    new PenumbraEvent('penumbra-ready', { detail: { penumbra } }),
  );
}
