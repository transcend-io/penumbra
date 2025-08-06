/**
 * StreamSaver types
 */
declare module 'streamsaver/StreamSaver.js' {
  /**
   * Create a write stream
   * @param filename - filename that should be used
   * @param options - options for the stream
   * @returns WritableStream
   */
  export function createWriteStream(
    filename: string,
    options?: {
      /** Size of the stream */
      size?: number;
      /** Pathname of the stream */
      pathname?: string;
      /** Writable strategy */
      writableStrategy?: QueuingStrategy<Uint8Array>;
      /** Readable strategy */
      readableStrategy?: QueuingStrategy<Uint8Array>;
    },
  ): WritableStream<Uint8Array>;

  /** MITM URL */
  export let mitm: string;

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
