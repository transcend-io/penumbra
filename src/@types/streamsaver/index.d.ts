/**
 * StreamSaver types
 */
declare module 'streamsaver/StreamSaver.js' {
  /**
   * Create a write stream
   * @param filename - Filename
   * @param size - Size
   * @returns WritableStream
   */
  export function createWriteStream(
    filename: string,
    size?: number,
  ): WritableStream;

  /** MITM URL */
  // eslint-disable-next-line import/no-mutable-exports, vars-on-top, no-var
  export var mitm: string;

  /** DOM context WritableStream constructor */
  type DOMContextWritableStream = globalThis.WritableStream;

  /** WritableStream constructor */
  const WritableStream: {
    /** Prototype */
    prototype: WritableStream;
    new <W = any>( // eslint-disable-line @typescript-eslint/no-explicit-any
      underlyingSink?: UnderlyingSink<W>,
      strategy?: QueuingStrategy<W>,
    ): WritableStream<W>;
  };
}
