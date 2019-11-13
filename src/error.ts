/** Penumbra error class */
export class PenumbraError extends Error {
  /** Extend new Error */
  constructor(error: string | Error) {
    if (typeof error === 'string') {
      super(error);
    } else {
      const { message } = error;
      super(message);
      Object.keys(error).forEach((key) => {
        if (key !== 'message') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any)[key] = (error as any)[key];
        }
      });
    }
    this.name = 'PenumbraError';
  }

  /** Error name */
  get [Symbol.toStringTag](): string {
    return this.name;
  }
}
