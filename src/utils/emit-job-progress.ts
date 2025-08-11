// penumbra
import type { PenumbraEventType, ProgressEmit, JobID } from '../types.js';
import { PenumbraEvent } from '../event.js';
import { logger } from '../logger.js';

/**
 * An event emitter for the decryption progress
 * @param type - type
 * @param totalBytesRead - the number of bytes read so far
 * @param contentLength - the total number of bytes to read
 * @param jobID - the unique job ID # or URL being read from
 * @param target - Target
 */
export default function emitJobProgress(
  type: PenumbraEventType,
  totalBytesRead: number,
  contentLength: number | null,
  jobID: JobID,
  target: EventTarget = self,
): void {
  // Calculate the progress remaining
  const percent = contentLength
    ? Math.round((totalBytesRead / contentLength) * 100)
    : null;

  const emitContent: Pick<ProgressEmit, 'detail'> = {
    detail: {
      type,
      percent,
      totalBytesRead,
      contentLength,
      id: jobID,
    },
  };

  // Dispatch the event
  const event = new PenumbraEvent('penumbra-progress', emitContent);
  target.dispatchEvent(event);

  // Debug logging
  if (!logger.workerJobTracker?.get(jobID)?.progressEmitted) {
    logger.debug(`${type} stream: started`, jobID);
    logger.workerJobTracker?.set(jobID, { progressEmitted: true });
  }
}
