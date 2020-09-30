import { Writer } from '@transcend-io/conflux';
import { createWriteStream } from 'streamsaver';
import { PenumbraFile } from './types';

/** PenumbraZipWriter constructor options */
export type ZipOptions = Partial<{
  /** Filename to save to (.zip is optional) */
  name: string;
  /** Total size of archive (if known ahead of time, for 'store' compression level) */
  size: number;
  /** PenumbraFile[] to add to zip archive */
  files: PenumbraFile[];
  /** Abort controller for cancelling zip generation and saving */
  controller: AbortController;
  /** Zip archive compression level */
  compressionLevel: number;
  // /** Store a copy of the resultant zip file in-memory for debug & testing */
  // debug: boolean;
}>;

/** Compression levels */
export enum Compression {
  /** No compression */
  Store = 0,
  /** Low compression */
  Low = 1,
  /** Medium compression */
  Medium = 2,
  /** High compression */
  High = 3,
}

/** Wrapped WritableStream for state keeping with StreamSaver */
export class PenumbraZipWriter {
  /** Conflux zip writer */
  private conflux: Writer = new Writer();

  /** Conflux zip writer */
  private writer: WritableStreamDefaultWriter = this.conflux.writable.getWriter();

  /** Save completion state */
  private closed = false;

  /** Debug mode */
  private debug = false;

  /** Debug zip buffer used for testing */
  private debugZipBuffer: Promise<ArrayBuffer> | null = null;

  /** Abort controller */
  public controller: AbortController;

  /**
   * Penumbra zip writer constructor
   *
   * @param options - ZipOptions
   * @returns PenumbraZipWriter class instance
   */
  constructor(options: ZipOptions = {}) {
    const {
      name = 'download',
      size,
      files,
      controller = new AbortController(),
      compressionLevel = Compression.Store,
      // debug = false,
    } = options;

    if (compressionLevel !== Compression.Store) {
      throw new Error(
        `penumbra.saveZip() doesn't support compression yet. Voice your support here: https://github.com/transcend-io/penumbra/issues`,
      );
    }

    this.controller = controller;
    const { signal } = controller;
    signal.addEventListener(
      'abort',
      () => {
        this.close();
      },
      {
        once: true,
      },
    );

    const saveStream = createWriteStream(
      // Append .zip to filename unless it is already present
      /\.zip\s*$/i.test(name) ? name : `${name}.zip`,
      size,
    );

    const { readable } = this.conflux;
    const zipStream = readable;
    // const [zipStream, debugZipStream]: [
    //   ReadableStream,
    //   ReadableStream | null,
    // ] = debug ? readable.tee() : [readable, null];

    zipStream.pipeTo(saveStream, { signal });

    if (files) {
      this.write(...files);
    }

    // // Buffer zip stream for debug & testing
    // if (debug && debugZipStream) {
    //   this.debug = debug;
    //   this.debugZipBuffer = new Response(debugZipStream).arrayBuffer();
    // }
  }

  /** Add PenumbraFiles to zip */
  write(...files: PenumbraFile[]): void {
    files.forEach(({ path, filePrefix, stream }) => {
      this.writer.write({
        name: `${path}${filePrefix}`,
        lastModified: new Date(0),
        stream: () =>
          stream instanceof ReadableStream
            ? stream
            : (new Response(stream).body as ReadableStream),
      });
    });
  }

  /** Close Penumbra zip writer */
  close(): void {
    if (!this.closed) {
      this.writer.close();
    }
  }

  /** Cancel Penumbra zip writer */
  abort(): void {
    if (!this.controller.signal.aborted) {
      this.controller.abort();
    }
  }

  // /** Get buffered output (requires debug mode) */
  // getBuffer(): Promise<ArrayBuffer> {
  //   if (!this.debug || !this.debugZipBuffer) {
  //     throw new Error(
  //       'getBuffer() can only be called on a PenumbraZipWriter in debug mode',
  //     );
  //   }
  //   return this.debugZipBuffer;
  // }
}

/**
 * Zip files retrieved by Penumbra
 *
 * @param options - ZipOptions
 * @returns PenumbraZipWriter class instance
 */
export function saveZip(options?: ZipOptions): PenumbraZipWriter {
  return new PenumbraZipWriter(options);
}
