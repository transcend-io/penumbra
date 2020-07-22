/* eslint-disable no-restricted-syntax */
/**
 * This eslint-disable is necessary. Using array.forEach() will
 * slow down concatUint8Arrays() significantly.
 */

/**
 * Concatenates multiple Uint8Arrays together
 * @param arrays - Uint8Arrays to concatenate
 * @returns - Concatenated Uint8Array
 */
function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

const MAX_ENTROPY_PER_PART = 0x10000;

/**
 * Generates an arbitrarily-sized Uint8Array filled with random values
 * @param size - Uint8Array size
 * @returns Uint8Array
 */
export default function generateRandomUint8Array(size: number): Uint8Array {
  const parts: Uint8Array[] = [];
  let initialized = 0;
  while (initialized < size) {
    parts.push(crypto.getRandomValues(new Uint8Array(MAX_ENTROPY_PER_PART)));
    initialized += MAX_ENTROPY_PER_PART;
  }
  return concatUint8Arrays(...parts);
}
