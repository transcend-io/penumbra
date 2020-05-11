import intoStream from 'into-stream';

/** Converts arrays into streams and passes  */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const intoStreamOnlyOnce = (input: any): any =>
  // eslint-disable-next-line no-underscore-dangle
  input && (input instanceof ReadableStream || input._read)
    ? input
    : intoStream(input);

export default intoStreamOnlyOnce;
