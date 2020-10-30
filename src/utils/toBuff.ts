import toBuffer from 'typedarray-to-buffer';

/**
 * Convert to buffer
 *
 * @param i - The input buffer or string
 * @returns Enforced as buffer
 */
export default (i: Buffer | string | ArrayBufferView): Buffer =>
  ArrayBuffer.isView(i)
    ? toBuffer(i as NodeJS.TypedArray)
    : typeof i === 'string'
    ? Buffer.from(i, 'base64')
    : i;
