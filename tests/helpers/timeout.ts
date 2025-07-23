/**
 * Timer management options
 */
export interface TimeoutManager {
  /** Cancel timeout */
  clear: () => void;
}

/**
 * Set and manage a timeout
 * @param callback - Timeout callback
 * @param delay - Time in seconds to wait before calling the callback
 * @returns Timeout cancellation helper
 */
export default function timeout(
  callback: () => void,
  delay: number,
): TimeoutManager {
  const timer = self.setTimeout(callback, delay * 1000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clear = self.clearTimeout.bind(self, timer as any);
  return { clear };
}
