import intoStream from 'into-stream';

/** Converts arrays into streams and passes  */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const intoStreamOnlyOnce = (input: any): any =>
  input &&
  (input instanceof ReadableStream ||
    // eslint-disable-next-line no-underscore-dangle
    input._read)
    ? input
    : intoStream(input);

export default intoStreamOnlyOnce;
