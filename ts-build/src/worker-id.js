"use strict";
// Hacky solution to store the current worker ID without re-writing our
// event emitters with worker ID dependency injection
Object.defineProperty(exports, "__esModule", { value: true });
let workerID = null;
/**
 * Get worker ID (if available)
 *
 * @returns Worker ID (if available)
 */
function getWorkerID() {
    return workerID;
}
exports.getWorkerID = getWorkerID;
/**
 * Set worker ID
 */
function setWorkerID(id) {
    workerID = id;
}
exports.setWorkerID = setWorkerID;
//# sourceMappingURL=worker-id.js.map