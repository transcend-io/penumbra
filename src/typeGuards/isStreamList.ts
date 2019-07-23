import { PenumbraFiles } from 'src/types';

/**
 * Detect if a PenumbraFiles instance is a File[] list
 *
 * @memberof module:typeGuards
 *
 * @param data - The data to verify
 * @returns 'files' if a list of files, 'streams' if a list of streams, or false if it is not a list.
 */
export default function isStreamList(data: PenumbraFiles): boolean {
  return (
    !(data instanceof ReadableStream) &&
    // [...{ ...data, ...spreadify }].every((item) => item instanceof ReadableStream)
    Array.prototype.every.call(data, (item) => item instanceof ReadableStream)
  );
}
