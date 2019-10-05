// penumbra
import { PenumbraEventType, ProgressEmit } from '../types';

/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param url the URL being read from
 * @returns
 */
export default function emitProgress(
  type: PenumbraEventType,
  totalBytesRead: number,
  contentLength: number,
  url: string,
): void {
  // Calculate the progress remaining
  const percent = Math.round((totalBytesRead / contentLength) * 100);
  const emitContent: Pick<ProgressEmit, 'detail'> = {
    detail: {
      type,
      percent,
      totalBytesRead,
      contentLength,
      url,
    },
  };

  // Dispatch the event
  const event = new CustomEvent('penumbra-progress', emitContent);
  self.dispatchEvent(event);
}
