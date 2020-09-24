/* eslint-disable max-classes-per-file */
/* tslint:disable completed-docs */

/** Webpack worker-loader type setup */
declare module 'worker-loader!*' {
  /** Worker */
  class WebpackWorker extends Worker {
    /** Webpack's Worker constructor */
    public constructor();
  }

  export default WebpackWorker;
}

/**
 * copies crypto definitions
 */
declare module 'crypto-browserify' {
  import {
    CipherGCM,
    CipherGCMOptions,
    CipherGCMTypes,
    DecipherGCM,
  } from 'crypto';

  /**
   * Create cipher iv
   */
  export function createCipheriv(
    algorithm: CipherGCMTypes,
    key: string | Buffer | NodeJS.TypedArray | DataView,
    iv: string | Buffer | NodeJS.TypedArray | DataView,
    options?: CipherGCMOptions,
  ): CipherGCM;

  /**
   * Create decipher iv
   */
  export function createDecipheriv(
    algorithm: CipherGCMTypes,
    key: string | Buffer | NodeJS.TypedArray | DataView,
    iv: string | Buffer | NodeJS.TypedArray | DataView,
    options?: CipherGCMOptions,
  ): DecipherGCM;
}

/**
 * Saving streams
 */
declare module 'streamsaver' {
  /**
   * Create a write stream
   */
  export function createWriteStream(
    filename: string,
    size?: number,
  ): WritableStream;

  /** DOM context WritableStream constructor */
  type DOMContextWritableStream = globalThis.WritableStream;

  /** WritableStream constructor */
  const WritableStream: {
    prototype: WritableStream;
    new <W = any>(
      underlyingSink?: UnderlyingSink<W>,
      strategy?: QueuingStrategy<W>,
    ): WritableStream<W>;
  };
}

/**
 * Conflux
 */
declare module '@transcend-io/conflux' {
  // TypeScript isn't aware of TransformStream
  /* eslint-disable no-undef */
  /** Conflux Zip Writer class */
  export class Writer extends TransformStream {
    /* eslint-enable no-undef */
    constructor();

    /** Write stream to filename in zip */
    write(params: {
      name: string;
      lastModified: Date;
      stream(): ReadableStream;
    }): void;

    close(): void;
  }
}

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
