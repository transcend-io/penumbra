import { base64ToUint8Array } from 'uint8array-extras';

/**
 * Helper to parse a base64-encoded string or Uint8Array
 * @param base64OrUint8Array - The base64-encoded string to parse, or a Uint8Array
 * @returns A Uint8Array of the decoded string, or the Uint8Array if it is already a Uint8Array
 */
export default function parseBase64OrUint8Array(
  base64OrUint8Array: string | Uint8Array,
): Uint8Array {
  return base64OrUint8Array instanceof Uint8Array
    ? base64OrUint8Array
    : base64ToUint8Array(base64OrUint8Array);
}
