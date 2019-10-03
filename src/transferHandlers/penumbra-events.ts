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

Comlink.transferHandlers.set('penumbra-encryption-complete', {
  /**
   * Checks if object is a penumbra-encryption-complete event
   *
   * @param object Object being passed through Comlink.transfer()
   * @returns true if the object is a penumbra-progress CustomEvent
   */
  canHandle(object: any) {
    return object instanceof CustomEvent && object.type === 'penumbra-progress';
  },
  /**
   * Serialize penumbra-encryption-complete event down to just EncryptionCompletion
   *
   * @param object Reference to the penumbra-encryption-complete CustomEvent
   * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
   */
  serialize(object: any) {
    return [object.detail, []];
  },
  /**
   * Re-create CustomEvent for re-dispatch in current context
   *
   * @param detail Structured-clone data from serialize()
   * @returns A re-created penumbra-encryption-complete CustomEvent
   */
  deserialize(detail: any) {
    return new CustomEvent('penumbra-encryption-complete', { detail });
  },
});
