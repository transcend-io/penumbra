import { Writer } from '@transcend-io/conflux';
import { createWriteStream } from 'streamsaver';
import mime from 'mime-types';
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
  /** Store a copy of the resultant zip file in-memory for debug & testing */
  debug: boolean;
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
  /** Conflux zip writer instance */
  private conflux: Writer = new Writer();

  /** Conflux WritableStream interface */
  private writer: WritableStreamDefaultWriter = this.conflux.writable.getWriter();

  /** Save completion state */
  private closed = false;

  /** Debug mode */
  private debug = false;

  /** Debug zip buffer used for testing */
  private debugZipBuffer: Promise<ArrayBuffer> | null = null;

  /** Pending unfinished write() calls */
  private pendingWrites: Promise<void>[] = [];

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
      debug = false,
    } = options;

    if (compressionLevel !== Compression.Store) {
      throw new Error(
        // eslint-disable-next-line max-len
        "penumbra.saveZip() doesn't support compression yet. Voice your support here: https://github.com/transcend-io/penumbra/issues",
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
    const [zipStream, debugZipStream]: [
      ReadableStream,
      ReadableStream | null,
    ] = debug ? readable.tee() : [readable, null];

    zipStream.pipeTo(saveStream, { signal });

    // Buffer zip stream for debug & testing
    if (debug && debugZipStream) {
      this.debug = debug;
      this.debugZipBuffer = new Response(debugZipStream).arrayBuffer();
    }

    if (files) {
      this.write(...files);
    }
  }

  /**
   * Add decrypted PenumbraFiles to zip
   *
   * @param files - Decrypted PenumbraFile[] to add to zip
   */
  write(...files: PenumbraFile[]): Promise<PromiseSettledResult<void>[]> {
    return Promise.allSettled(
      files.map(
        async ({
          path,
          filePrefix,
          stream,
          mimetype,
          lastModified = new Date(),
        }) => {
          const name = path || filePrefix;
          if (!name) {
            throw new Error(
              'PenumbraZipWriter.write(): Unable to determine filename',
            );
          }
          const hasExtension = /[^/]*\.\w+$/.test(name);
          const fullPath = `${name}${
            hasExtension ? '' : mime.extension(mimetype)
          }`;
          const reader = (stream instanceof ReadableStream
            ? stream
            : (new Response(stream).body as ReadableStream)
          ).getReader();
          const writeComplete = new Promise<void>((resolve) => {
            const completionTrackerStream = new ReadableStream({
              /** Start completion tracker-wrapped ReadableStream */
              async start(controller) {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                  // eslint-disable-next-line no-await-in-loop
                  const { done, value } = await reader.read();

                  // When no more data needs to be consumed, break the reading
                  if (done) {
                    resolve();
                    break;
                  }

                  // Enqueue the next data chunk into our target stream
                  controller.enqueue(value);
                }

                // Close the stream
                controller.close();
                reader.releaseLock();
              },
            });

            this.writer.write({
              name: fullPath,
              lastModified,
              stream: () => completionTrackerStream,
            });
          });

          this.pendingWrites.push(writeComplete);
          return writeComplete;
        },
      ),
    );
  }

  /** Enqueue closing of the Penumbra zip writer (after pending writes finish) */
  async close(): Promise<PromiseSettledResult<void>[]> {
    const writes = await Promise.allSettled(this.pendingWrites);
    if (!this.closed) {
      this.writer.close();
      this.closed = true;
    }
    return writes;
  }

  /** Cancel Penumbra zip writer */
  abort(): void {
    if (!this.controller.signal.aborted) {
      this.controller.abort();
    }
  }

  /** Get buffered output (requires debug mode) */
  getBuffer(): Promise<ArrayBuffer> {
    if (!this.closed) {
      throw new Error(
        'getBuffer() can only be called when a PenumbraZipWriter is closed',
      );
    }
    if (!this.debug || !this.debugZipBuffer) {
      throw new Error(
        'getBuffer() can only be called on a PenumbraZipWriter in debug mode',
      );
    }
    return this.debugZipBuffer;
  }
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
