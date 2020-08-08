/**
 * Get worker ID (if available)
 * TODO: Remove the need for this with better dependency injection
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
