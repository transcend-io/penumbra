/**
 * Returns an object URL to display media directly on a webpage
 *
 * @param rs - A readable stream of decrypted bytes
 * @returns The object URL to be added to an src attribute/prop
 */
export default function getMediaSrcFromRS(rs: ReadableStream): Promise<string> {
  return new Response(rs).blob().then((blob) => URL.createObjectURL(blob));
}
