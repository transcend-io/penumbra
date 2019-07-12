/**
 * Timer management options
 */
export type TimeoutManager = {
  /** Cancel timeout */
  clear: () => void;
};

/**
 * Get the cryptographic hash of an ArrayBuffer
 *
 * @param callback - Timeout callback
 * @param delay - Time in seconds to wait before calling the callback
 * @returns Timeout cancellation helper
 */
export default function timeout(
  callback: Function,
  delay: number,
): TimeoutManager {
  const timer = window.setTimeout(callback, delay * 1000);
  const clear = window.clearTimeout.bind(window, timer);
  return { clear };
}
