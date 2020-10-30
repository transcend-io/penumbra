import { toWebReadableStream } from 'web-streams-node';
import { NativeReadableStream } from '../streams';

/** Converts arrays into ReadableStreams  */
const intoStream = (
  input:
    | ArrayBuffer
    | ArrayBufferView
    | ReadableStream
    | NodeJS.ReadableStream
    | NodeJS.TypedArray
    | Buffer,
): ReadableStream =>
  input instanceof NativeReadableStream ||
  (input as any)?.constructor?.name === 'ReadableStream'
    ? (input as ReadableStream)
    : input instanceof ArrayBuffer || ArrayBuffer.isView(input)
    ? new Response(input).body
    : toWebReadableStream(input);

export default intoStream;
