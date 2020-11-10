import toBuffer from 'typedarray-to-buffer';

/**
 * Convert to NodeJS Buffer. The input is simply returned if
 * it is already a NodeJS Buffer.
 *
 * @param i - The input buffer or string
 * @returns Enforced as buffer
 */
export default (i: Buffer | string | ArrayBufferView): Buffer =>
  toBuffer(
    ArrayBuffer.isView(i)
      ? // input is a typed array
        (i as NodeJS.TypedArray)
      : // input is a base64 string
        Uint8Array.from(atob(i), (c) => c.charCodeAt(0)),
  );
