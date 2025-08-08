import type { JobID } from './types';
import { getWorkerID } from './worker-id';

/** Penumbra error class */
export class PenumbraError extends Error {
  /** The download URL or job ID throwing an error */
  public id: JobID;

  /** The worker ID associated with this error */
  public worker: number | null;

  /** Error message */
  public override message: string;

  /**
   * Extend new Error
   * @param error - Error
   * @param id - ID
   */
  constructor(error: string | Error, id: JobID) {
    if (typeof error === 'string') {
      super(error);
      this.message = error;
    } else {
      const { message } = error;
      super(message);
      for (const key of Object.keys(error)) {
        if (key !== 'message') {
          const descriptor = Object.getOwnPropertyDescriptor(error, key);
          if (descriptor) {
            Object.defineProperty(this, key, descriptor);
          }
        }
      }
    }
    this.message = typeof error === 'string' ? error : error.message;
    this.id = id;
    this.worker = getWorkerID();
    this.name = 'PenumbraError';
  }

  /**
   * Error name
   * @returns Name
   */
  get [Symbol.toStringTag](): string {
    return this.name;
  }
}
