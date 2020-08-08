// FIXME: Remove the need for this file with better dependency injection

/**
 * Get worker ID (if available)
 *
 * @returns Worker ID (if available)
 */
export function getWorkerID(): number | null {
  const id = self.workerID;
  return typeof id === 'number' ? id : null;
}

/**
 * Set worker ID
 */
export function setWorkerID(id: number | null): void {
  self.workerID = id;
}
