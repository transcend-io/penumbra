// penumbra
import { PenumbraEvent } from '../event';
import { JobCompletionEmit, PenumbraDecryptionInfo } from '../types';

/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param url the URL being read from
 * @returns
 */
export default function emitEncryptionCompletion(
  id: number,
  decryptionInfo: PenumbraDecryptionInfo,
): void {
  const emitContent: Pick<JobCompletionEmit, 'detail'> = {
    detail: { id, decryptionInfo },
  };

  // Dispatch the event
  const event = new PenumbraEvent('penumbra-complete', emitContent);
  self.dispatchEvent(event);
}
