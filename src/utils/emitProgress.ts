// penumbra
import { ProgressEmit } from '../types';

/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param url the URL being read from
 * @returns
 */
export default function emitProgress(
  totalBytesRead: number,
  contentLength: number,
  url: string,
  progressEventName: string = url,
): void {
  // Calculate the progress remaining
  const percent = Math.round((totalBytesRead / contentLength) * 100);
  const emitContent: Pick<ProgressEmit, 'detail'> = {
    detail: {
      percent,
      totalBytesRead,
      contentLength,
      url,
    },
  };

  // Dispatch the event
  const event = new CustomEvent(progressEventName, emitContent);
  self.dispatchEvent(event); /* eslint-disable-line no-restricted-globals */
}
