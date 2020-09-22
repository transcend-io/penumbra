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
  /** File writer queue */
  private queue: PenumbraFile[] = [];

  /** Conflux zip writer */
  private writer: Writer;

  /** Underlying WritableStream */
  private stream: WritableStream;

  /** Penumbra Zip Writer Constructor */
  constructor(
    name: string,
    size?: number,
    files?: PenumbraFile[],
    compressionLevel = Compression.Store,
  ) {
    if (compressionLevel !== Compression.Store) {
      throw new Error(
        `penumbra.saveZip() doesn't support compression yet. Voice your support here: https://github.com/transcend-io/penumbra/issues`,
      );
    }
    this.writer = new Writer();
    this.stream = createWriteStream(`${name}.zip`, size);
    if (files) {
      this.write(...files);
    }
    console.log('compression level:', compressionLevel);
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
  compressionLevel: number = Compression.Store,
) {
  return new PenumbraZipWriter(name, size, files, compressionLevel);
}
