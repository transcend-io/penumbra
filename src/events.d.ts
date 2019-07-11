/* tslint:disable completed-docs */

// penumbra
import { ProgressEmit } from './types';

declare global {
  /**
   * Mapping from event listeners to their underlying types
   */
  interface WindowEventMap {
    /** Emit during penumbra download */
    'my-custom-event': ProgressEmit;
  }
}
