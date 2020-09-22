import streamSaver from 'streamsaver';
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
export class PenumbraZipWriter extends WritableStream {
  /** File writer queue */
  private queue: PenumbraFile[] = [];

  /** Underlying WritableStream */
  private stream: WritableStream;

  /** globalThis.WritableStream constructor */
  constructor(
    name: string,
    size?: number,
    compressionLevel = Compression.Store,
  ) {
    super(); // FIXME: remove this
    this.stream = streamSaver.createWriteStream(name, size);
  }

  /** Add PenumbraFiles to zip */
  add(...files: PenumbraFile[]): void {
    this.queue.push(...files);
  }
}

/** Zip files retrieved by Penumbra */
async function createZip(
  compressionLevel: number = Compression.Store,
): Promise<PenumbraZipWriter> {
  if (compressionLevel !== Compression.Store) {
    throw new Error(
      `penumbra.createZip() doesn't support compression yet. Voice your support here: https://github.com/transcend-io/penumbra/issues`,
    );
  }
  return new PenumbraZipWriter();
}
