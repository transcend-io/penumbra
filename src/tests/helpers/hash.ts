/**
 * Get the cryptographic hash of an ArrayBuffer
 *
 * @param algorithm - Cryptographic hash digest algorithm
 * @param ab - ArrayBuffer to digest
 * @returns Hexadecimal hash digest string
 */
export default async function hash(
  algorithm: string,
  ab: ArrayBuffer | Promise<ArrayBuffer>,
): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest(algorithm, await ab),
  );
  return digest.reduce((memo, i) => memo + i.toString(16).padStart(2, '0'), '');
}
