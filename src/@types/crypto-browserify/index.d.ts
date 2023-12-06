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
   * @param algorithm - Cipher algorithm
   * @param key - Cipher key
   * @param iv - Cipher iv
   * @param options - Cipher options
   * @returns Cipher
   */
  export function createCipheriv(
    algorithm: CipherGCMTypes,
    key: string | Buffer | NodeJS.TypedArray | DataView,
    iv: string | Buffer | NodeJS.TypedArray | DataView,
    options?: CipherGCMOptions,
  ): CipherGCM;

  /**
   * Create decipher iv
   * @param algorithm - Cipher algorithm
   * @param key - Cipher key
   * @param iv - Cipher iv
   * @param options - Cipher options
   * @returns Decipher iv
   */
  export function createDecipheriv(
    algorithm: CipherGCMTypes,
    key: string | Buffer | NodeJS.TypedArray | DataView,
    iv: string | Buffer | NodeJS.TypedArray | DataView,
    options?: CipherGCMOptions,
  ): DecipherGCM;
}
