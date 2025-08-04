/* eslint-disable no-restricted-syntax */
/**
 * Buffer an entire readable stream into a Uint8Array
 * @param readableStream - The readable stream to buffer
 * @returns A Uint8Array of the buffered stream
 */
export default async function bufferEntireStream(
  readableStream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      totalLength += value.length;
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  } finally {
    reader.releaseLock();
  }
}
/* eslint-enable no-restricted-syntax */
