// penumbra
import { PenumbraEvent } from '../event';
import { JobCompletionEmit, PenumbraDecryptionInfo } from '../types';

/**
 * An event emitter for job completion
 *
 * @param id - Job ID
 * @param decryptionInfo - PenumbraDecryptionInfo
 * @param target - Target
 */
export default function emitJobCompletion(
  id: string | number,
  decryptionInfo: PenumbraDecryptionInfo,
  target: EventTarget = self,
): void {
  const emitContent: Pick<JobCompletionEmit, 'detail'> = {
    detail: { id, decryptionInfo },
  };

  // Dispatch the event
  const event = new PenumbraEvent('penumbra-complete', emitContent);
  target.dispatchEvent(event);
}
