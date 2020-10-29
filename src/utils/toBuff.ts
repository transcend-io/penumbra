import toBuffer from 'typedarray-to-buffer';

/**
 * Convert to buffer
 *
 * @param i - The input buffer or string
 * @returns Enforced as buffer
 */
export default (i: Buffer | string | Uint8Array): Buffer =>
  i instanceof Uint8Array
    ? toBuffer(i)
    : typeof i === 'string'
    ? Buffer.from(i, 'base64')
    : i;
