/**
 * Conflux types
 */
declare module '@transcend-io/conflux' {
  // TypeScript isn't aware of TransformStream
  /* eslint-disable no-undef */
  /** Conflux Zip Writer class */
  export class Writer extends TransformStream {
    /* eslint-enable no-undef */
    constructor();

    /** Write stream to filename in zip */
    write(params: {
      /** Name */
      name: string;
      /** Last modified */
      lastModified: Date;
      stream(): ReadableStream;
    }): void;

    close(): void;
  }
}
