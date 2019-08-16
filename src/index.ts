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

/** Extend global Window */
declare global {
  /** Extend window.penumbra */
  interface Window {
    /** penumbra interface */
    penumbra?: PenumbraAPI;
  }
}

self.penumbra = penumbra;

self.dispatchEvent(new CustomEvent('penumbra-ready', { detail: { penumbra } }));
