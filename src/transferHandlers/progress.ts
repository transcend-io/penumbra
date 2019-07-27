/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Comlink from 'comlink';

Comlink.transferHandlers.set('penumbra-progress', {
  /** Checks if object is a penumbra-progress event */
  canHandle(object: any) {
    return object instanceof CustomEvent && object.type === 'penumbra-progress';
  },
  /** Serialize penumbra-progress event down to just ProgressDetails */
  serialize(object: any) {
    return [object.detail, []];
  },
  /** Re-create CustomEvent for re-dispatch in current context */
  deserialize(detail: any) {
    return new CustomEvent('penumbra-progress', { detail });
  },
});
