// global
import { PenumbraFiles } from '../types';

/**
 * Detect if a PenumbraFiles instance is a File[] list
 *
 * @memberof module:typeGuards
 *
 * @param data - The data to verify
 * @returns True if a list of files
 */
export default function isFileList(data: PenumbraFiles): data is File[] {
  return (
    !(data instanceof ReadableStream) &&
    // [...{ ...data, ...spreadify }].every((item) => item instanceof File)
    Array.prototype.every.call(data, (item) => item instanceof File)
  );
}
