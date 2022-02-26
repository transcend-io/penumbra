/* eslint-disable @typescript-eslint/no-explicit-any */
import { transferHandlers } from 'comlink';
import { PenumbraEvent } from '../event';
import { getWorkerID } from '../worker-id';

/** TODO: abstract this into a re-usable event registration & serialization helper */

transferHandlers.set('penumbra-progress', {
  /**
   * Checks if object is a penumbra-progress event
   *
   * @param object - Object being passed through Comlink.transfer()
   * @returns true if the object is a penumbra-progress PenumbraEvent
   */
  canHandle(object: any): object is CustomEvent {
    return (
      object instanceof PenumbraEvent && object.type === 'penumbra-progress'
    );
  },
  /**
   * Serialize penumbra-progress event down to just ProgressDetails
   *
   * @param object - Reference to the penumbra-progress PenumbraEvent
   * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
   */
  serialize(object: any) {
    return [{ ...object.detail, worker: getWorkerID() }, []];
  },
  /**
   * Re-create PenumbraEvent for re-dispatch in current context
   *
   * @param detail - Structured-clone data from serialize()
   * @returns A re-created penumbra-progress PenumbraEvent
   */
  deserialize(detail: any) {
    return new PenumbraEvent('penumbra-progress', { detail });
  },
});

transferHandlers.set('penumbra-complete', {
  /**
   * Checks if object is a penumbra-complete event
   *
   * @param object - Object being passed through Comlink.transfer()
   * @returns true if the object is a penumbra-progress PenumbraEvent
   */
  canHandle(object: any): object is CustomEvent {
    return (
      object instanceof PenumbraEvent && object.type === 'penumbra-complete'
    );
  },
  /**
   * Serialize penumbra-complete event down to just JobCompletion
   *
   * @param object - Reference to the penumbra-complete PenumbraEvent
   * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
   */
  serialize(object: any) {
    return [{ ...object.detail, worker: getWorkerID() }, []];
  },
  /**
   * Re-create PenumbraEvent for re-dispatch in current context
   *
   * @param detail - Structured-clone data from serialize()
   * @returns A re-created penumbra-complete PenumbraEvent
   */
  deserialize(detail: any) {
    return new PenumbraEvent('penumbra-complete', {
      detail,
    });
  },
});

transferHandlers.set('penumbra-error', {
  /**
   * Checks if object is a penumbra-error event
   *
   * @param object - Object being passed through Comlink.transfer()
   * @returns true if the object is a penumbra-progress PenumbraEvent
   */
  canHandle(object: any): object is CustomEvent {
    return object instanceof PenumbraEvent && object.type === 'penumbra-error';
  },
  /**
   * Serialize penumbra-progress event down to just ProgressDetails
   *
   * @param object - Reference to the penumbra-progress PenumbraEvent
   * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
   */
  serialize(object: any) {
    return [{ ...object.detail, worker: getWorkerID() }, []];
  },
  /**
   * Re-create PenumbraEvent for re-dispatch in current context
   *
   * @param detail - Structured-clone data from serialize()
   * @returns A re-created penumbra-progress PenumbraEvent
   */
  deserialize(detail: any) {
    return new PenumbraEvent('penumbra-error', { detail });
  },
});

transferHandlers.set('error', {
  /**
   * Checks if object is an error event
   *
   * @param object - Object being passed through Comlink.transfer()
   * @returns true if the object is a penumbra-progress PenumbraEvent
   */
  canHandle(object: any): object is ErrorEvent {
    return object instanceof ErrorEvent && object.type === 'error';
  },
  /**
   * Serialize penumbra-progress event down to just ProgressDetails
   *
   * @param object - Reference to the penumbra-progress PenumbraEvent
   * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
   */
  serialize(object: any) {
    return [{ ...object, worker: getWorkerID() }, []];
  },
  /**
   * Re-create PenumbraEvent for re-dispatch in current context
   *
   * @param detail - Structured-clone data from serialize()
   * @returns A re-created penumbra-progress PenumbraEvent
   */
  deserialize(detail: any) {
    const event = new ErrorEvent('error', detail);
    if (detail) {
      Object.keys(detail).forEach((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(event, key);
        if (
          key !== 'isTrusted' &&
          descriptor &&
          (descriptor.configurable || 'set' in descriptor)
        ) {
          (event as any)[key] = detail[key];
        }
      });
    }
    return event;
  },
});
/* eslint-enable @typescript-eslint/no-explicit-any */
