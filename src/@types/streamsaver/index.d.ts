/**
 * StreamSaver types
 */
declare module 'streamsaver' {
  /**
   * Create a write stream
   */
  export function createWriteStream(
    filename: string,
    size?: number,
  ): WritableStream;

  /** DOM context WritableStream constructor */
  type DOMContextWritableStream = globalThis.WritableStream;

  /** WritableStream constructor */
  const WritableStream: {
    prototype: WritableStream;
    new <W = any>(
      underlyingSink?: UnderlyingSink<W>,
      strategy?: QueuingStrategy<W>,
    ): WritableStream<W>;
  };
}
