declare global {
  interface Window {
    /**
     * `requestIdleCallback()`
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
     */
    requestIdleCallback: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (...args: any[]) => any,
      options?: {
        /** Callback timeout */
        timeout?: number;
      },
    ) => number;
  }
}

const {
  setTimeout,
  requestIdleCallback = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => any,
    options: {
      /** Callback timeout */
      timeout: number;
    } = { timeout: 0 },
  ): number => setTimeout(callback, options.timeout),
} = self;

/**
 * Helper for throwing errors without interrupting our code
 *
 * @param ex - Error to throw
 */
const throwOutside = (ex: Error | DOMException | DOMError): void => {
  requestIdleCallback(() => {
    throw ex;
  });
};

export default throwOutside;
