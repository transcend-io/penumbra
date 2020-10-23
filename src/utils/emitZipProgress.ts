// penumbra
import type { PenumbraZipWriter, ZipProgressEmit } from '../types';
import { PenumbraEvent } from '../event';

/**
 * An event emitter for PenumbraZipWriter progress
 * @param writer - PenumbraZipWriter instance
 * @param totalBytesRead - The number of bytes or items written so far
 * @param contentLength - The total number of bytes or items to write
 * @returns
 */
export default function emitZipProgress(
  writer: PenumbraZipWriter,
  totalBytesRead: number,
  contentLength: number,
): void {
  // Calculate the progress remaining
  const percent = Math.round((totalBytesRead / contentLength) * 100);

  const emitContent: Pick<ZipProgressEmit, 'detail'> = {
    detail: {
      percent,
      totalBytesRead,
      contentLength,
    },
  };

  // Dispatch the event
  const event = new PenumbraEvent('progress', emitContent);
  writer.dispatchEvent(event);
}
