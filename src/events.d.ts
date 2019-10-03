/* tslint:disable completed-docs */

// penumbra
import { PenumbraReady, ProgressEmit, EncryptionCompletionEmit } from './types';

declare global {
  /**
   * Mapping from event listeners to their underlying types
   */
  interface WindowEventMap {
    /** Emit during Penumbra downloads */
    'penumbra-progress': ProgressEmit;
    /** Emit upon the completion of an Penumbra encryption job */
    'penumbra-encryption-complete': EncryptionCompletionEmit;
    /** Emit once Penumbra is ready to be used */
    'penumbra-ready': PenumbraReady;
  }
}
