// penumbra
import type { PenumbraEventType, ProgressEmit } from '../types';
import { PenumbraEvent } from '../event';

/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param id the unique job ID # or URL being read from
 * @returns
 */
export default function emitProgress(
  type: PenumbraEventType,
  totalBytesRead: number,
  contentLength: number,
  id: string | number,
  target: EventTarget = self,
): void {
  // Calculate the progress remaining
  const percent = Math.round((totalBytesRead / contentLength) * 100);

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
