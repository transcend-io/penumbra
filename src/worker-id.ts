// FIXME: Remove the need for this file with better dependency injection

let workerId: number | null = null;

/**
 * Get worker ID (if available)
 *
 * @returns Worker ID (if available)
 */
export function getWorkerID(): number | null {
  return workerId;
}

/**
 * Set worker ID
 */
export function setWorkerID(id: number | null): void {
  workerId = id;
}
