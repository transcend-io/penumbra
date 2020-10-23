import allSettled from 'promise.allsettled';
import { Writer } from '@transcend-io/conflux';
import { createWriteStream } from 'streamsaver';
import mime from 'mime-types';
import { PenumbraFile, ZipOptions } from './types';
import emitZipProgress from './utils/emitZipProgress';
import emitZipCompletion from './utils/emitZipCompletion';

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
export class PenumbraZipWriter extends EventTarget {
  /** Conflux zip writer instance */
  private conflux: Writer = new Writer();

  /** Conflux WritableStream interface */
  private writer: WritableStreamDefaultWriter = this.conflux.writable.getWriter();

  /** Save completion state */
  private closed = false;

  /** Save complete buffer */
  private saveBuffer = false;

  /** Zip buffer used for testing */
  private zipBuffer: Promise<ArrayBuffer> | undefined;

  /** Allow & auto-rename duplicate files sent to writer */
  private allowDuplicates: boolean;

  /** All written & pending file paths */
  private files = new Set<string>();

  /** Abort controller */
  private controller: AbortController;

  /** All pending finished and unfinished zip file writes */
  private writes: Promise<void>[] = [];

  /** Number of finished zip file writes */
  private completedWrites = 0;

  /** Total zip archive size */
  private byteSize: number | null = 0;

  /** Current zip archive size */
  private bytesWritten = 0;

  /**
   * Penumbra zip writer constructor
   *
   * @param options - ZipOptions
   * @returns PenumbraZipWriter class instance
   */
  constructor(options: ZipOptions = {}) {
    super();

    const {
      name = 'download',
      size,
      files,
      controller = new AbortController(),
      compressionLevel = Compression.Store,
      saveBuffer = false,
      allowDuplicates = true,
      onProgress,
      onComplete,
    } = options;

    if (compressionLevel !== Compression.Store) {
      throw new Error(
        // eslint-disable-next-line max-len
        'penumbra.saveZip() does not support compression yet. Voice your support here: https://github.com/transcend-io/penumbra/issues',
      );
    }

    this.allowDuplicates = allowDuplicates;
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

    // Auto-register onProgress & onComplete listeners
    if (typeof onProgress === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.addEventListener('progress', onProgress as any);
    }

    if (typeof onComplete === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.addEventListener('complete', onComplete as any);
    }

    const saveStream = createWriteStream(
      // Append .zip to filename unless it is already present
      /\.zip\s*$/i.test(name) ? name : `${name}.zip`,
      size,
    );

    const { readable } = this.conflux;
    const [zipStream, bufferedZipStream]: [
      ReadableStream,
      ReadableStream | null,
    ] = saveBuffer ? readable.tee() : [readable, null];

    zipStream.pipeTo(saveStream, { signal });

    // Buffer zip stream for debug & testing
    if (saveBuffer && bufferedZipStream) {
      this.saveBuffer = saveBuffer;
      this.zipBuffer = new Response(bufferedZipStream).arrayBuffer();
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const zip = this;
    // Add file sizes to total zip size
    if (zip.byteSize !== null) {
      const sizes = files.map(({ size }) => size);
      const sizeUnknown = sizes.some((size) => isNaN(size as number));
      if (sizeUnknown) {
        zip.byteSize = null;
      } else {
        zip.byteSize += files
          .map(({ size }) => size || 0)
          .reduce((acc, val) => acc + val);
      }
    }
    return allSettled(
      files.map(
        async ({
          path,
          filePrefix,
          stream,
          mimetype,
          lastModified = new Date(),
        }) => {
          // Resolve file path
          const name = path || filePrefix;
          if (!name) {
            throw new Error(
              'PenumbraZipWriter.write(): Unable to determine filename',
            );
          }
          const [filename, extension = mime.extension(mimetype)] = name
            .split(/(\.\w+\s*$)/) // split filename extension
            .filter(Boolean); // filter empty matches
          let filePath = `${filename}${extension}`;

          // Handle duplicate files
          if (zip.files.has(filePath)) {
            const warning = `penumbra.saveZip(): Duplicate file detected: ${filePath}`;
            if (zip.allowDuplicates) {
              console.warn(warning);
            } else {
              this.abort();
              throw new Error(warning);
            }

            // This code picks a filename when auto-renaming conflicting files.
            // If {filename}{extension} exists it will create {filename} (1){extension}, etc.
            let i = 0;
            // eslint-disable-next-line no-plusplus
            while (zip.files.has(`${filename} (${++i})${extension}`));
            filePath = `${filename} (${i})${extension}`;
            console.warn(
              `penumbra.saveZip(): Duplicate file renamed: ${filePath}`,
            );
          }

          zip.files.add(filePath);

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
                  if (zip.byteSize !== null) {
                    zip.bytesWritten += value.byteLength;
                    emitZipProgress(zip, zip.bytesWritten, zip.byteSize);
                  }
                  // When no more data needs to be consumed, break the reading
                  if (done) {
                    resolve();
                    // eslint-disable-next-line no-plusplus
                    zip.completedWrites++;
                    // Emit file-granular progress events when total byte size can't be determined
                    if (zip.byteSize === null) {
                      emitZipProgress(
                        zip,
                        zip.completedWrites,
                        zip.writes.length,
                      );
                    }
                    if (zip.completedWrites >= zip.writes.length) {
                      emitZipCompletion(zip);
                    }
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

            zip.writer.write({
              name: filePath,
              lastModified,
              stream: () => completionTrackerStream,
            });
          });

          zip.writes.push(writeComplete);
          return writeComplete;
        },
      ),
    );
  }

  /** Enqueue closing of the Penumbra zip writer (after pending writes finish) */
  async close(): Promise<PromiseSettledResult<void>[]> {
    const writes = await allSettled(this.writes);
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

  /** Get buffered output (requires saveBuffer mode) */
  getBuffer(): Promise<ArrayBuffer> {
    if (!this.closed) {
      throw new Error(
        'getBuffer() can only be called when a PenumbraZipWriter is closed',
      );
    }
    if (!this.saveBuffer || !this.zipBuffer) {
      throw new Error(
        'getBuffer() can only be called on a PenumbraZipWriter in buffered mode, e.g. createZip({ saveBuffer: true })',
      );
    }
    return this.zipBuffer;
  }

  /** Get all written & pending file paths */
  getFiles(): string[] {
    return [...this.files];
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
