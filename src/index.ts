/**
 *
 * ## Penumbra
 * A file decryption library for the browser
 *
 * @module penumbra
 */

// exports
import penumbra from './API';
import './transferHandlers/progress';
import { PenumbraAPI } from './types';

export * from './types';
export { penumbra };

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
