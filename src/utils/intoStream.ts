import { toWebReadableStream } from 'web-streams-node';
import { ReadableStream } from '../streams';

/** Converts arrays into ReadableStreams  */
const intoStream = (
  input:
    | ArrayBuffer
    | ArrayBufferView
    | ReadableStream
    | NodeJS.ReadableStream
    | NodeJS.TypedArray
    | Buffer,
): ReadableStream => {
  let loggedInput: any = input;
  (self as any).intoStreamLastInput = input;
  try {
    loggedInput = JSON.stringify(input);
  } catch (ex) {
    console.warn(ex);
  }
  console.log('intoStream() called', {
    input: loggedInput,
    type: typeof input,
  });
  const res =
    input instanceof ReadableStream ||
    (input as any)?.constructor?.name === 'ReadableStream'
      ? (input as ReadableStream)
      : input instanceof ArrayBuffer || ArrayBuffer.isView(input)
      ? new Response(input).body
      : toWebReadableStream(input);
  console.log('result: ', res);
  return res;
};

export default intoStream;
