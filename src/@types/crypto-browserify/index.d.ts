/* tslint:disable completed-docs */

/**
 * Node crypto definitions
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
