/**
 * The crypto-browserify module is missing typing information
 */
declare module 'crypto-browserify' {
  /**
   * Create an iv for a decipher
   */
  export function createDecipheriv(
    algorithm: CipherCCMTypes,
    key: BinaryLike,
    iv: BinaryLike | null,
    options?: CipherCCMOptions,
  ): DecipherCCM;

  /**
   * Create an ECDH curve
   */
  export function createECDH(curve_name: string): ECDH;

  /**
   * Create a cipher
   */
  export function createCipheriv(
    algorithm: CipherCCMTypes,
    key: CipherKey,
    iv: BinaryLike | null,
    options?: CipherCCMOptions,
  ): CipherCCM;

  /**
   * Create an HMAC
   */
  export function createHmac(
    algorithm: string,
    key: BinaryLike,
    options?: stream.TransformOptions,
  ): Hmac;

  /**
   * Generate random bytes
   */
  export function randomBytes(size: number): Buffer;
}
