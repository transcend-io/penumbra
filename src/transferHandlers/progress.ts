/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Comlink from 'comlink';

Comlink.transferHandlers.set('penumbra-progress', {
  /**
   * Checks if object is a penumbra-progress event
   *
   * @param object Object being passed through Comlink.transfer()
   * @returns true if the object is a penumbra-progress CustomEvent
   */
  canHandle(object: any) {
    return object instanceof CustomEvent && object.type === 'penumbra-progress';
  },
  /**
   * Serialize penumbra-progress event down to just ProgressDetails
   *
   * @param object Reference to the penumbra-progress CustomEvent
   * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
   */
  serialize(object: any) {
    return [object.detail, []];
  },
  /**
   * Re-create CustomEvent for re-dispatch in current context
   *
   * @param detail Structured-clone data from serialize()
   * @returns A re-created penumbra-progress CustomEvent
   */
  deserialize(detail: any) {
    return new CustomEvent('penumbra-progress', { detail });
  },
});
