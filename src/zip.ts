import { Writer } from '@transcend-io/conflux';
import { createWriteStream } from 'streamsaver';
import { PenumbraFile } from './types';

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

  /** Save abortion state */
  private aborted = false;

  /** Abort controller */
  public controller: AbortController;

  /**
   * Penumbra zip writer constructor
   *
   * @param name - Filename to save to (.zip optional)
   * @param size - Total size of archive (if known ahead of time, for 'store' compression level)
   * @param files - PenumbraFile[] to add to zip archive
   * @param controller - Abort controller for cancelling save
   * @param compressionLevel - Compression level
   * @returns PenumbraZipWriter class instance
   */
  constructor(
    name = 'download',
    size?: number,
    files?: PenumbraFile[],
    controller = new AbortController(),
    compressionLevel = Compression.Store,
  ) {
    if (compressionLevel !== Compression.Store) {
      throw new Error(
        `penumbra.saveZip() doesn't support compression yet. Voice your support here: https://github.com/transcend-io/penumbra/issues`,
      );
    }

    this.controller = controller;
    const { signal } = controller;
    signal.addEventListener('abort', this.close.bind(this), {
      once: true,
    });

    const saveStream = createWriteStream(
      // Append .zip to filename unless it is already present
      /\.zip\s*$/i.test(name) ? name : `${name}.zip`,
      size,
    );

    if (files) {
      this.write(...files);
    }

    const { readable } = this.conflux;
    console.log(`saving ${name}`);
    readable.pipeTo(saveStream, { signal });
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
    if (!this.aborted) {
      this.writer.close();
      this.aborted = true;
    }
  }
}

/**
 * Zip files retrieved by Penumbra
 *
 * @param name - Filename to save to (.zip optional)
 * @param size - Total size of archive (if known ahead of time, for 'store' compression level)
 * @param files - PenumbraFile[] to add to zip archive
 * @param controller - Abort controller for cancelling save
 * @param compressionLevel - Compression level
 * @returns PenumbraZipWriter class instance
 */
export function saveZip(
  name?: string,
  size?: number,
  files?: PenumbraFile[],
  controller?: AbortController,
  compressionLevel?: number,
): PenumbraZipWriter {
  return new PenumbraZipWriter(name, size, files, controller, compressionLevel);
}
