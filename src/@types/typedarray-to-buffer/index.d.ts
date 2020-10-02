/* tslint:disable completed-docs */

/** typedarray-to-buffer types */
declare module 'typedarray-to-buffer' {
  type TypedArray =
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array;
  function toBuffer(arr: TypedArray): Buffer;

  namespace toBuffer {}

  export = toBuffer;
}
