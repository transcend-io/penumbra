/**
 * Helper to convert base64-encoded string to Uint8Array
 * @param base64 - The base64-encoded string to convert
 * @returns A Uint8Array of the decoded string
 */
export function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(base64); // decode to binary string
  const { length } = bin;
  const bytes = new Uint8Array(length); // allocate 32-byte array

  for (let index = 0; index < length; index += 1) {
    const char = bin.codePointAt(index);
    if (char === undefined) {
      throw new Error(`Invalid base64 string: ${base64}`);
    }
    bytes[index] = char; // map each char to its byte value
  }

  return bytes;
}

/**
 * Helper to parse a base64-encoded string or Uint8Array
 * @param base64OrUint8Array - The base64-encoded string to parse, or a Uint8Array
 * @returns A Uint8Array of the decoded string, or the Uint8Array if it is already a Uint8Array
 */
export function parseBase64OrUint8Array(
  base64OrUint8Array: string | Uint8Array,
): Uint8Array {
  return base64OrUint8Array instanceof Uint8Array
    ? base64OrUint8Array
    : base64ToUint8Array(base64OrUint8Array);
}
