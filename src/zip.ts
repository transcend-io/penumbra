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
  private writer: Writer = this.conflux.writable.getWriter();

  /** Underlying WritableStream */
  private stream: WritableStream;

  /** Abort controller */
  public controller: AbortController;

  /** Penumbra Zip Writer Constructor */
  constructor(
    name: string,
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
    const { signal } = controller;
    this.controller = controller;
    const { readable } = this.conflux;
    const saveStream = createWriteStream(`${name}.zip`, size);
    this.stream = saveStream;
    if (files) {
      this.write(...files);
    }
    console.log(`saving ${name}`);
    readable.pipeTo(saveStream, { signal });
    signal.addEventListener(
      'abort',
      () => {
        this.writer.close();
      },
      { once: true },
    );
  }

  /** Add PenumbraFiles to zip */
  write(...files: PenumbraFile[]): void {
    files.forEach(({ path, filePrefix, stream }) => {
      this.writer.write({
        name: `${path}${filePrefix}`,
        lastModified: new Date(0),
        stream: () => stream,
      });
    });
  }

  /** Close Penumbra Zip Writer */
  close(): void {
    this.writer.close();
  }
}

/** Zip files retrieved by Penumbra */
export function saveZip(
  name = 'download',
  size?: number,
  files?: PenumbraFile[],
  controller = new AbortController(),
  compressionLevel: number = Compression.Store,
): PenumbraZipWriter {
  return new PenumbraZipWriter(name, size, files, controller, compressionLevel);
}
