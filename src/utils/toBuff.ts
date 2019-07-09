/**
 * Convert to buffer
 *
 * @param i - The input buffer or string
 * @returns Enforced as buffer
 */
export default (i: Buffer | string): Buffer =>
  typeof i === 'string' ? Buffer.from(i, 'base64') : i;
