// penumbra
import { PenumbraEvent } from '../event';
import { JobCompletionEmit, PenumbraDecryptionInfo } from '../types';

/**
 * An event emitter for job completion
 * @param id - Job ID
 * @param decryptionInfo - PenumbraDecryptionInfo
 */
export default function emitJobCompletion(
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
