import {
  ReadableStream as ReadableStreamPonyfill,
  WritableStream as WritableStreamPonyfill,
  TransformStream as TransformStreamPonyfill,
} from 'web-streams-polyfill/ponyfill';

// Replace every Stream API on browsers that don't support pipeThrough & pipeTo
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nativeReadableStream = self.ReadableStream as any;
const nativeReadableStreamProto = nativeReadableStream.prototype as any;
export const fullReadableStreamSupport: boolean =
  nativeReadableStreamProto?.pipeTo && nativeReadableStreamProto?.pipeThrough;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ReadableStream = (fullReadableStreamSupport
  ? self.ReadableStream
  : ReadableStreamPonyfill) as typeof self.ReadableStream;
export const ReadableStreamIsNative =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReadableStream !== ReadableStreamPonyfill;

export const WritableStream =
  (fullReadableStreamSupport && self.WritableStream) || WritableStreamPonyfill;
export const WritableStreamIsNative = WritableStream !== WritableStreamPonyfill;

export const TransformStream =
  (fullReadableStreamSupport && self.TransformStream) ||
  TransformStreamPonyfill;
export const TransformStreamIsNative =
  TransformStream !== TransformStreamPonyfill;

export {
  ReadableStreamPonyfill,
  WritableStreamPonyfill,
  TransformStreamPonyfill,
};

// We could make a Proxy layer that upgrades all ReadableStream.*() calls into a new stream for Firefox.
// It might be better to just wait for Mozilla to finish their streams implementation instead.
