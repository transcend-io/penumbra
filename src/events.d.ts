/* tslint:disable completed-docs */

// penumbra
import {
  EncryptionCompletionEmit,
  PenumbraReady,
  ProgressEmit,
  PenumbraErrorEmit,
} from './types';

declare global {
  /**
   * Mapping from event listeners to their underlying types
   */
  interface WindowEventMap {
    /** Emit during Penumbra downloads */
    'penumbra-progress': ProgressEmit;
    /** Emit upon the completion of an Penumbra encryption job */
    'penumbra-encryption-complete': EncryptionCompletionEmit;
    /** Emit whenever the Penumbra worker encounters any errors */
    'penumbra-error': PenumbraErrorEmit;
    /** Emit once Penumbra is ready to be used */
    'penumbra-ready': PenumbraReady;
  }
}
