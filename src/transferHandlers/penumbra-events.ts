/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Comlink from 'comlink';

/** TODO: abstract this into a re-usable event registration & serialization helper */

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
    return (
      object instanceof CustomEvent &&
      object.type === 'penumbra-encryption-complete'
    );
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

Comlink.transferHandlers.set('penumbra-error', {
  /**
   * Checks if object is a penumbra-progress event
   *
   * @param object Object being passed through Comlink.transfer()
   * @returns true if the object is a penumbra-progress CustomEvent
   */
  canHandle(object: any) {
    return object instanceof CustomEvent && object.type === 'penumbra-error';
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
    return new CustomEvent('penumbra-error', { detail });
  },
});

Comlink.transferHandlers.set('error', {
  /**
   * Checks if object is a penumbra-progress event
   *
   * @param object Object being passed through Comlink.transfer()
   * @returns true if the object is a penumbra-progress CustomEvent
   */
  canHandle(object: any) {
    return object instanceof ErrorEvent && object.type === 'error';
  },
  /**
   * Serialize penumbra-progress event down to just ProgressDetails
   *
   * @param object Reference to the penumbra-progress CustomEvent
   * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
   */
  serialize(object: any) {
    return [object, []];
  },
  /**
   * Re-create CustomEvent for re-dispatch in current context
   *
   * @param detail Structured-clone data from serialize()
   * @returns A re-created penumbra-progress CustomEvent
   */
  deserialize(detail: any) {
    const event = new ErrorEvent('error');
    if (detail) {
      Object.keys(detail).forEach((key) => {
        (event as any)[key] = detail[key];
      });
    }
  },
});
