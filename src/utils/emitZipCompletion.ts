// penumbra
import { PenumbraZipWriter, ZipCompletionEmit } from '../types';
import { PenumbraEvent } from '../event';

/**
 * An event emitter for zip writer file completion
 * @param writer - PenumbraZipWriter instance
 */
export default function emitZipCompletion(writer: PenumbraZipWriter): void {
  const emitContent: Pick<ZipCompletionEmit, 'detail'> = {
    detail: {},
  };

  // Dispatch the event
  const event = new PenumbraEvent('complete', emitContent);
  writer.dispatchEvent(event);
}
