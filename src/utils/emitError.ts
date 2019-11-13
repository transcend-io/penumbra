/* eslint-disable no-restricted-syntax */

import { PenumbraError } from '../error';
import { PenumbraErrorEmit } from '../types';

/**
 * An event emitter for errors and exceptions
 * @param error Error object to emit
 * @returns
 */
export default function emitError(error: PenumbraError): void {
  const detail =
    error instanceof PenumbraError ? error : new PenumbraError(error);
  const emitContent: Pick<PenumbraErrorEmit, 'detail'> = { detail };
  // Dispatch the event
  const event = new CustomEvent('penumbra-error', emitContent);
  self.dispatchEvent(event);
}
