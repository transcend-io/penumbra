/**
 * Timer management options
 */
export type TimeoutManager = {
  /** Cancel timeout */
  clear: () => void;
};

/**
 * Set and manage a timeout
 *
 * @param callback - Timeout callback
 * @param delay - Time in seconds to wait before calling the callback
 * @returns Timeout cancellation helper
 */
export default function timeout(
  // tslint:disable-next-line: ban-types
  callback: Function,
  delay: number,
): TimeoutManager {
  const timer = window.setTimeout(callback, delay * 1000);
  const clear = window.clearTimeout.bind(window, timer);
  return { clear };
}
