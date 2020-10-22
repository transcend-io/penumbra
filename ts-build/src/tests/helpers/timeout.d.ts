/**
 * Timer management options
 */
export declare type TimeoutManager = {
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
export default function timeout(callback: Function, delay: number): TimeoutManager;
//# sourceMappingURL=timeout.d.ts.map