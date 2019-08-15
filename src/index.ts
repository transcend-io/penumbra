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
import { PenumbraView } from './types';

export * from './types';
export { penumbra };

const view: PenumbraView = self as Window;
view.penumbra = penumbra;

view.dispatchEvent(new CustomEvent('penumbra-ready', { detail: { penumbra } }));
