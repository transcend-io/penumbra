declare module 'crypto-browserify' {
  import { CipherGCMTypes,  CipherGCMOptions, DecipherGCM } from 'crypto';
  export function createDecipheriv(
    algorithm: CipherGCMTypes,
    key: string | Buffer | NodeJS.TypedArray | DataView,
    iv: string | Buffer | NodeJS.TypedArray | DataView,
    options?: CipherGCMOptions,
  ): DecipherGCM;
}


declare module 'streamsaver' {
  export function createWriteStream(
    filename: string,
    size?: number,
  ): WritableStream;
}


declare module 'typedarray-to-buffer' {
  type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;
  function toBuffer(
    arr: TypedArray,
  ): Buffer;

  namespace toBuffer {}

  export = toBuffer;
}