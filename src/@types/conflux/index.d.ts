/**
 * Conflux types
 */
declare module '@transcend-io/conflux' {
  // TypeScript isn't aware of TransformStream
  /** Conflux Zip Writer class */
  export class Writer extends TransformStream {
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
