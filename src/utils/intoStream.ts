import { toWebReadableStream } from 'web-streams-node';
import { NativeReadableStream } from '../streams';

/**
 * Converts arrays into ReadableStreams
 * @param input - Input
 * @returns Stream
 */
const intoStream = (
  input:
    | ArrayBuffer
    | ArrayBufferView
    | ReadableStream
    | NodeJS.ReadableStream
    | NodeJS.TypedArray
    | Buffer,
): ReadableStream => {
  if (
    input instanceof NativeReadableStream ||
    input?.constructor?.name === 'ReadableStream'
  ) {
    return input as ReadableStream;
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    const response = new Response(input);
    if (response.body === null) {
      throw new TypeError('Response.body is null');
    }
    return response.body;
  }

  return toWebReadableStream(input);
};

export default intoStream;
