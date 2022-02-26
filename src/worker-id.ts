// Hacky solution to store the current worker ID without re-writing our
// event emitters with worker ID dependency injection

let workerID: number | null = null;

/**
 * Get worker ID (if available)
 *
 * @returns Worker ID (if available)
 */
export function getWorkerID(): number | null {
  return workerID;
}

/**
 * Set worker ID
 *
 * @param id
 */
export function setWorkerID(id: number | null): void {
  workerID = id;
}
