// penumbra
import { PenumbraEvent } from '../event';
import type { JobCompletionEmit, PenumbraDecryptionInfo } from '../types';

/**
 * An event emitter for job completion
 * @param id - Job ID
 * @param decryptionInfo - PenumbraDecryptionInfo
 */
export default function emitJobCompletion(
  id: number,
  decryptionInfo: PenumbraDecryptionInfo,
  target: EventTarget = self
): void {
  const emitContent: Pick<JobCompletionEmit, 'detail'> = {
    detail: { id, decryptionInfo },
  };

  // Dispatch the event
  const event = new PenumbraEvent('penumbra-complete', emitContent);
  target.dispatchEvent(event);
}
