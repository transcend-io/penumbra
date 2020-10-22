"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const comlink_1 = require("comlink");
const event_1 = require("../event");
const worker_id_1 = require("../worker-id");
/** TODO: abstract this into a re-usable event registration & serialization helper */
comlink_1.transferHandlers.set('penumbra-progress', {
    /**
     * Checks if object is a penumbra-progress event
     *
     * @param object Object being passed through Comlink.transfer()
     * @returns true if the object is a penumbra-progress PenumbraEvent
     */
    canHandle(object) {
        return (object instanceof event_1.PenumbraEvent && object.type === 'penumbra-progress');
    },
    /**
     * Serialize penumbra-progress event down to just ProgressDetails
     *
     * @param object Reference to the penumbra-progress PenumbraEvent
     * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
     */
    serialize(object) {
        return [{ ...object.detail, worker: worker_id_1.getWorkerID() }, []];
    },
    /**
     * Re-create PenumbraEvent for re-dispatch in current context
     *
     * @param detail Structured-clone data from serialize()
     * @returns A re-created penumbra-progress PenumbraEvent
     */
    deserialize(detail) {
        return new event_1.PenumbraEvent('penumbra-progress', { detail });
    },
});
comlink_1.transferHandlers.set('penumbra-complete', {
    /**
     * Checks if object is a penumbra-complete event
     *
     * @param object Object being passed through Comlink.transfer()
     * @returns true if the object is a penumbra-progress PenumbraEvent
     */
    canHandle(object) {
        return (object instanceof event_1.PenumbraEvent && object.type === 'penumbra-complete');
    },
    /**
     * Serialize penumbra-complete event down to just JobCompletion
     *
     * @param object Reference to the penumbra-complete PenumbraEvent
     * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
     */
    serialize(object) {
        return [{ ...object.detail, worker: worker_id_1.getWorkerID() }, []];
    },
    /**
     * Re-create PenumbraEvent for re-dispatch in current context
     *
     * @param detail Structured-clone data from serialize()
     * @returns A re-created penumbra-complete PenumbraEvent
     */
    deserialize(detail) {
        return new event_1.PenumbraEvent('penumbra-complete', {
            detail,
        });
    },
});
comlink_1.transferHandlers.set('penumbra-error', {
    /**
     * Checks if object is a penumbra-progress event
     *
     * @param object Object being passed through Comlink.transfer()
     * @returns true if the object is a penumbra-progress PenumbraEvent
     */
    canHandle(object) {
        return object instanceof event_1.PenumbraEvent && object.type === 'penumbra-error';
    },
    /**
     * Serialize penumbra-progress event down to just ProgressDetails
     *
     * @param object Reference to the penumbra-progress PenumbraEvent
     * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
     */
    serialize(object) {
        return [{ ...object.detail, worker: worker_id_1.getWorkerID() }, []];
    },
    /**
     * Re-create PenumbraEvent for re-dispatch in current context
     *
     * @param detail Structured-clone data from serialize()
     * @returns A re-created penumbra-progress PenumbraEvent
     */
    deserialize(detail) {
        return new event_1.PenumbraEvent('penumbra-error', { detail });
    },
});
comlink_1.transferHandlers.set('error', {
    /**
     * Checks if object is a penumbra-progress event
     *
     * @param object Object being passed through Comlink.transfer()
     * @returns true if the object is a penumbra-progress PenumbraEvent
     */
    canHandle(object) {
        return object instanceof ErrorEvent && object.type === 'error';
    },
    /**
     * Serialize penumbra-progress event down to just ProgressDetails
     *
     * @param object Reference to the penumbra-progress PenumbraEvent
     * @returns [Clonables (structured-clone-compatible objects), [Transferables]]
     */
    serialize(object) {
        return [{ ...object, worker: worker_id_1.getWorkerID() }, []];
    },
    /**
     * Re-create PenumbraEvent for re-dispatch in current context
     *
     * @param detail Structured-clone data from serialize()
     * @returns A re-created penumbra-progress PenumbraEvent
     */
    deserialize(detail) {
        const event = new ErrorEvent('error', detail);
        if (detail) {
            Object.keys(detail).forEach((key) => {
                event[key] = detail[key];
            });
        }
        return event;
    },
});
//# sourceMappingURL=penumbra-events.js.map