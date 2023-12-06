import { PenumbraError } from '../error';
import { PenumbraErrorEmit } from '../types';
import { PenumbraEvent } from '../event';

/**
 * An event emitter for errors and exceptions
 * @param error - Error object to emit
 */
export default function emitError(error: PenumbraError): void {
  const detail =
    error instanceof PenumbraError ? error : new PenumbraError(error, 'NA');
  const emitContent: Pick<PenumbraErrorEmit, 'detail'> = { detail };
  // Dispatch the event
  const event = new PenumbraEvent('penumbra-error', emitContent);
  self.dispatchEvent(event);
}
