/**
 * typedarray-to-buffer types
 * @param arr - Typed array
 * @returns Buffer
 */
declare module 'typedarray-to-buffer' {
  function toBuffer(arr: NodeJS.TypedArray): Buffer;

  namespace toBuffer {}

  export = toBuffer;
}
