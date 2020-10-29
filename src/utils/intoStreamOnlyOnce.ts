import intoStream from 'into-stream';
import { Readable } from 'stream';
import { toWebReadableStream } from 'web-streams-node';

/** Converts arrays into ReadableStreams  */
const intoStreamOnlyOnce = (
  input: ArrayBuffer | NodeJS.TypedArray | ReadableStream | Readable,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any =>
  input instanceof ReadableStream
    ? input
    : toWebReadableStream(
        // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
        (input as any)._read
          ? input
          : intoStream(input as ArrayBuffer | NodeJS.TypedArray),
      );

export default intoStreamOnlyOnce;
