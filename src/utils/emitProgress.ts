// penumbra
import { PenumbraEventType, ProgressEmit, type JobID } from '../types';
import { PenumbraEvent } from '../event';

/**
 * An event emitter for the decryption progress
 * @param type - type
 * @param totalBytesRead - the number of bytes read so far
 * @param contentLength - the total number of bytes to read
 * @param id - the unique job ID # or URL being read from
 * @param target - Target
 */
export default function emitProgress(
  type: PenumbraEventType,
  totalBytesRead: number,
  contentLength: number | null,
  id: JobID,
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
      id,
    },
  };

  // Dispatch the event
  const event = new PenumbraEvent('penumbra-progress', emitContent);
  target.dispatchEvent(event);
}
