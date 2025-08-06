const {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  setTimeout,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  requestIdleCallback = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/prevent-abbreviations
    callback: (...args: any[]) => any,
    // eslint-disable-next-line unicorn/no-object-as-default-parameter
    options: {
      /** Callback timeout */
      timeout: number;
    } = { timeout: 0 },
  ): number => setTimeout(callback, options.timeout),
} = self;

/**
 * Helper for throwing errors without interrupting our code
 * @param ex - Error to throw
 */
const throwOutside = (ex: Error | DOMException): void => {
  requestIdleCallback(() => {
    throw ex;
  });
};

export default throwOutside;
