/**
 * Reads a stream to completion and returns the underlying text
 *
 * @param rs - A readable stream of decrypted bytes
 * @returns The decrypted text
 */
export default function getTextFromRS(rs: ReadableStream): Promise<string> {
  return new Response(rs).text();
}
