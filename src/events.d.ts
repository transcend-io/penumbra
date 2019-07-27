/* tslint:disable completed-docs */

// penumbra
import { ProgressEmit, PenumbraReady } from './types';

declare global {
  /**
   * Mapping from event listeners to their underlying types
   */
  interface WindowEventMap {
    /** Emit during Penumbra downloads */
    'penumbra-progress': ProgressEmit;
    /** Emit once Penumbra is ready to be used */
    'penumbra-ready': PenumbraReady;
  }
}
