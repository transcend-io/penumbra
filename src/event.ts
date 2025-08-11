import type {
  JobCompletionEmit,
  PenumbraErrorEmit,
  ProgressEmit,
} from './types.js';

declare global {
  /**
   * Mapping from event listeners to their underlying types
   */
  interface WindowEventMap {
    /** Emit during Penumbra downloads */
    'penumbra-progress': ProgressEmit;
    /** Emit upon the completion of an Penumbra encryption job */
    'penumbra-complete': JobCompletionEmit;
    /** Emit whenever the Penumbra worker encounters any errors */
    'penumbra-error': PenumbraErrorEmit;
  }
}

export const PenumbraEvent = CustomEvent;
