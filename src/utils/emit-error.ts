import { PenumbraError } from '../error.js';
import type { PenumbraErrorEmit, JobID } from '../types.js';
import { PenumbraEvent } from '../event.js';

/**
 * An event emitter for errors and exceptions
 * @param error - Error object to emit
 * @param jobID - Job ID
 */
export default function emitError(error: unknown, jobID: JobID): void {
  const detail: PenumbraError =
    error instanceof PenumbraError
      ? error
      : error instanceof Error
        ? new PenumbraError(error, jobID)
        : new PenumbraError(String(error), jobID);

  // Dispatch the event
  const emitContent: Pick<PenumbraErrorEmit, 'detail'> = { detail };
  const event = new PenumbraEvent('penumbra-error', emitContent);
  self.dispatchEvent(event);
}
