/* eslint-disable no-restricted-globals */
/**
 *
 * ## Penumbra
 * A file decryption library for the browser
 *
 * @module penumbra
 */

// exports
import penumbra from './API';
import { PenumbraView } from './types';

export * from './types';
export default penumbra;

const view: PenumbraView = (self || exports) as Window;
view.penumbra = penumbra;

self.dispatchEvent(new CustomEvent('penumbra-ready', { detail: penumbra }));
