import { PenumbraEventType } from '../types';
/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param id the unique job ID # or URL being read from
 * @returns
 */
export default function emitProgress(type: PenumbraEventType, totalBytesRead: number, contentLength: number, id: string | number): void;
//# sourceMappingURL=emitProgress.d.ts.map