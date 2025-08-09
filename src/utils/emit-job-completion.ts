// penumbra
import { PenumbraEvent } from '../event';
import type {
  JobCompletionEmit,
  PenumbraDecryptionInfo,
  JobID,
  PenumbraEventType,
} from '../types';
import { logger } from '../logger';

/**
 * An event emitter for job completion
 * @param jobID - Job ID
 * @param decryptionInfo - PenumbraDecryptionOptions
 * @param target - Target
 */
export default function emitJobCompletion(
  type: PenumbraEventType,
  jobID: JobID,
  decryptionInfo: PenumbraDecryptionInfo,
  target: EventTarget = self,
): void {
  const emitContent: Pick<JobCompletionEmit, 'detail'> = {
    detail: { id: jobID, decryptionInfo },
  };

  // Dispatch the event
  const event = new PenumbraEvent('penumbra-complete', emitContent);
  target.dispatchEvent(event);

  // Debug logging
  logger.debug(`${type} stream: completed`, jobID);
  logger.workerJobTracker?.delete(jobID);
}
