// penumbra
import { PenumbraZipWriter, ZipProgressEmit } from '../types';
import { PenumbraEvent } from '../event';

/**
 * An event emitter for PenumbraZipWriter progress
 *
 * @param writer - PenumbraZipWriter instance
 * @param written - The number of bytes or items written so far
 * @param size - The total number of bytes or items to write
 */
export default function emitZipProgress(
  writer: PenumbraZipWriter,
  written: number,
  size: number | null,
): void {
  // Calculate the progress remaining
  const percent = size === null ? null : Math.round((written / size) * 100);

  const emitContent: Pick<ZipProgressEmit, 'detail'> = {
    detail: {
      percent,
      written,
      size,
    },
  };

  // Dispatch the event
  const event = new PenumbraEvent('progress', emitContent);
  writer.dispatchEvent(event);
}
