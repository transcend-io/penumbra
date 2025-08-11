import { Writer } from '@transcend-io/conflux';
import mime from 'mime';
import { StreamSaverInstance } from './streamsaver';
import type { PenumbraFile, ZipOptions } from './types';
import {
  isNumber,
  emitZipProgress,
  emitZipCompletion,
  throwOutside,
} from './utils';
import { logger } from './logger';

/**
 * Sum the total size of all writes
 * @param writes - Array of promises that resolve to a number
 * @returns The total size of all writes
 */
const sumWrites = async (writes: Promise<number>[]): Promise<number> => {
  const results = await Promise.allSettled<Promise<number>[]>(writes);
  const sum = (
    results.filter(
      ({ status }) => status === 'fulfilled',
    ) as PromiseFulfilledResult<number>[]
  )
    .map(({ value }) => value)
    .reduce((accumulator, item) => accumulator + item, 0);

  if (results.some(({ status }) => status === 'rejected')) {
    const errors = results.filter(
      ({ status }) => status === 'rejected',
    ) as PromiseRejectedResult[];

    for (const error of errors) {
      logger.error(error.reason, null);
    }
    // Throw AggregateError to console
    throwOutside(
      new AggregateError(
        errors,
        `File${errors.length > 1 ? 's' : ''} failed to be written to zip`,
      ),
    );
  }

  return sum;
};

/**
 * Save a zip containing files retrieved by Penumbra
 * @example new PenumbraZipWriter(options)
 * @param options - ZipOptions
 * @returns PenumbraZipWriter class instance
 */
export class PenumbraZipWriter extends EventTarget {
  /** Conflux zip writer instance */
  private conflux: Writer = new Writer();

  /** Conflux WritableStream interface */
  private writer: WritableStreamDefaultWriter =
    this.conflux.writable.getWriter();

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
  private writes: Promise<number>[] = [];

  /** Number of finished zip file writes */
  private completedWrites = 0;

  /** Total zip archive size */
  public byteSize: number | null = 0;

  /** Current zip archive size */
  private bytesWritten = 0;

  /**
   * Penumbra zip writer constructor
   * @param options - ZipOptions
   * @returns PenumbraZipWriter class instance
   */
  constructor({
    streamSaverEndpoint,
    name = 'download',
    size,
    controller = new AbortController(),
    saveBuffer = false,
    allowDuplicates = true,
    onProgress,
    onComplete,
  }: ZipOptions) {
    super();

    if (isNumber(size)) {
      this.byteSize = size;
    }
    this.allowDuplicates = allowDuplicates;
    this.controller = controller;
    const { signal } = controller;
    signal.addEventListener(
      'abort',
      () => {
        this.close().catch((error: unknown) => {
          logger.error(
            `Failed to close zip writer: ${error instanceof Error ? error.message : String(error)}`,
            null,
          );
        });
      },
      { once: true },
    );

    // Auto-register onProgress & onComplete listeners
    if (typeof onProgress === 'function') {
      this.addEventListener('progress', onProgress as EventListener);
    }

    if (typeof onComplete === 'function') {
      this.addEventListener('complete', onComplete as EventListener, {
        once: true,
      });
    }

    const { streamSaver } = new StreamSaverInstance(streamSaverEndpoint);

    const saveStream = streamSaver.createWriteStream(
      // Append .zip to filename unless it is already present
      /\.zip\s*$/i.test(name) ? name : `${name}.zip`,
      { size },
    );

    const { readable } = this.conflux;
    const [zipStream, bufferedZipStream]: [
      ReadableStream,
      ReadableStream | null,
    ] = saveBuffer ? readable.tee() : [readable, null];

    /**
     * This is intentionally not awaited because it does not complete until the entire stream has finished.
     * We want the main caller to be able to error-handle the function for any errors during stream setup.
     *
     * The consumer can handle the event via the streams interface.
     */
    zipStream.pipeTo(saveStream, { signal }).catch((error: unknown) => {
      const finalError =
        error instanceof Error
          ? error
          : typeof error === 'string'
            ? new Error(error)
            : new Error('Unknown error');
      finalError.message = `penumbra.saveZip() failed to create zip: ${finalError.message}`;
      logger.error(finalError, null);
    });

    // Buffer zip stream for debug & testing
    if (saveBuffer && bufferedZipStream) {
      this.saveBuffer = saveBuffer;
      this.zipBuffer = new Response(bufferedZipStream).arrayBuffer();
    }
  }

  /**
   * Get observed zip size after all pending writes are resolved
   * @returns The size of zip
   */
  getSize(): Promise<number> {
    return sumWrites(this.writes);
  }

  /**
   * Add decrypted PenumbraFiles to zip
   * @param files - Decrypted PenumbraFile[] to add to zip
   * @returns Total observed size of write call in bytes
   */
  write(...files: PenumbraFile[]): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
    const zip = this;

    // Add file sizes to total zip size
    const sizes = files.map(({ size }) => size);
    const totalWriteSize = sizes.every((size) => isNumber(size))
      ? sizes.reduce((accumulator, value) => accumulator + value, 0)
      : null;
    if (zip.byteSize !== null) {
      if (totalWriteSize === null) {
        zip.byteSize = null;
      } else {
        zip.byteSize += totalWriteSize;
      }
    }

    return sumWrites(
      files.map(
        ({ path, filePrefix, stream, mimetype, lastModified = new Date() }) => {
          let writeSize = 0;
          // Resolve file path
          const name = path ?? filePrefix;
          if (!name) {
            throw new Error(
              'PenumbraZipWriter.write(): Unable to determine filename',
            );
          }

          // Split filename and extension
          const [filename, extensionCandidateFromFilename] = name
            .split(/(\.\w+\s*$)/) // split filename extension
            .filter(Boolean) as [string, string | undefined]; // filter empty matches

          // Get extension from mimetype
          const extensionCandidateFromMime =
            mimetype && mime.getExtension(mimetype);

          const extension =
            extensionCandidateFromFilename?.slice(1) ??
            extensionCandidateFromMime ??
            '';

          let filePath = `${filename}.${extension}`;

          // Handle duplicate files
          if (zip.files.has(filePath)) {
            const dupe = filePath;
            // This code picks a filename when auto-renaming conflicting files.
            // If {filename}.{extension} exists it will create {filename} (1).{extension}, etc.
            let index = 0;

            while (
              zip.files.has(
                `${filename} (${(++index).toString()}).${extension}`,
              )
            );
            filePath = `${filename} (${index.toString()}).${extension}`;
            const warning = `penumbra.saveZip(): Duplicate file ${JSON.stringify(
              dupe,
            )}`;
            if (zip.allowDuplicates) {
              logger.warn(
                `${warning} renamed to ${JSON.stringify(filePath)}`,
                null,
              );
            } else {
              zip.abort();
              throw new Error(warning);
            }
          }

          zip.files.add(filePath);

          const reader = stream.getReader();
          const writeComplete = new Promise<number>((resolve, reject) => {
            const completionTrackerStream = new ReadableStream<Uint8Array>({
              /**
               * Start completion tracker-wrapped ReadableStream
               * @param controller - Controller
               */
              async start(controller) {
                while (true) {
                  const { done, value } = await reader.read();
                  if (value) {
                    const chunkSize = value.byteLength;
                    writeSize += chunkSize;
                    if (zip.byteSize !== null) {
                      zip.bytesWritten += chunkSize;
                      emitZipProgress(zip, zip.bytesWritten, zip.byteSize);
                    }
                  }
                  // When no more data needs to be consumed, break the reading
                  if (done) {
                    resolve(writeSize);

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
                    // Re-calculate zip.byteSize after indeterminate writes
                    if (totalWriteSize === null) {
                      let size = 0;

                      for (const write of zip.writes) {
                        size += await write;
                      }
                      zip.byteSize ??= size;
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
              cancel: (reason) => {
                const error =
                  reason instanceof Error
                    ? reason
                    : typeof reason === 'string'
                      ? new Error(reason)
                      : new Error('Unknown error');

                error.message = `penumbra.saveZip() stream was cancelled: ${error.message}`;
                reject(error);
              },
            });

            /**
             * Not awaited, but it will reject the writeComplete promise if the write fails
             */
            zip.writer
              .write({
                name: filePath,
                lastModified,
                stream: () => completionTrackerStream,
              })
              .catch((error: unknown) => {
                const finalError =
                  error instanceof Error
                    ? error
                    : typeof error === 'string'
                      ? new Error(error)
                      : new Error('Unknown error');

                finalError.message = `penumbra.saveZip() failed to write file ${filePath}: ${finalError.message}`;
                reject(finalError);
              });
          });

          zip.writes.push(writeComplete);

          return writeComplete;
        },
      ),
    );
  }

  /**
   * Enqueue closing of the Penumbra zip writer (after pending writes finish)
   * @returns Total observed zip size in bytes after close completes
   */
  async close(): Promise<number> {
    const size = await this.getSize();
    if (!this.closed) {
      await this.writer.close();
      this.closed = true;
    }
    return size;
  }

  /** Cancel Penumbra zip writer */
  abort(): void {
    if (!this.controller.signal.aborted) {
      this.controller.abort();
    }
  }

  /**
   * Get buffered output (requires saveBuffer mode)
   * @returns buffer
   */
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

  /**
   * Get all written & pending file paths
   * @returns Files
   */
  getFiles(): string[] {
    return [...this.files];
  }
}
