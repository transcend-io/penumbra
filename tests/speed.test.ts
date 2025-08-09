import { Bench } from 'tinybench';
import { penumbra } from '../src/index';
import {
  createEncryptionStream,
  init,
} from '@transcend-io/encrypt-web-streams';

// For logging in tests, don't use the logger from src/logger.ts which is intended for Penumbra's internal logging
const logger = console;

// Initialize the Wasm module
await init();

// Create a key and iv
const key = new Uint8Array(32);
const iv = new Uint8Array(12);

// Crypto key
const cryptoKey = await crypto.subtle.importKey(
  'raw',
  key,
  { name: 'AES-GCM' },
  false,
  ['encrypt', 'decrypt'],
);

function makeReadableStream({
  numChunks,
  chunkSize,
}: {
  numChunks: number;
  chunkSize: number;
}): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (let index = 0; index < numChunks; index++) {
        const chunk = new Uint8Array(chunkSize);
        for (let index = 0; index < chunk.length; index++) {
          chunk[index] = Math.floor(Math.random() * 256);
        }
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

const STREAM_SIZES = [
  {
    label: '2 chunks of 8MiB',
    numChunks: 2,
    chunkSize: 2 ** 23,
  },
  {
    label: '100 chunks of 64KiB',
    numChunks: 100,
    chunkSize: 2 ** 16,
  },
  {
    label: '1000 chunks of 1KiB',
    numChunks: 1000,
    chunkSize: 2 ** 10,
  },
] as const;

const results: Record<
  (typeof STREAM_SIZES)[number]['label'],
  ReturnType<typeof Bench.prototype.table>
> = {
  '2 chunks of 8MiB': [],
  '100 chunks of 64KiB': [],
  '1000 chunks of 1KiB': [],
};

for (const { label, numChunks, chunkSize } of STREAM_SIZES) {
  // Benchmark
  const bench = new Bench({
    name: `encrypt and decrypt: ${label}`,
    iterations: 8,
  });
  bench
    .add('penumbra.encrypt', async () => {
      const readableStream = makeReadableStream({ numChunks, chunkSize });
      const penumbraFile = await penumbra.encrypt(
        { key, iv },
        { stream: readableStream },
      );
      await penumbraFile.stream.pipeTo(new WritableStream());
    })
    .add('encrypt-web-streams.encrypt', async () => {
      // Streams
      const readableStream = makeReadableStream({ numChunks, chunkSize });
      const encryptionStream = createEncryptionStream(key, iv);

      await readableStream
        .pipeThrough(encryptionStream)
        .pipeTo(new WritableStream());
    })
    .add('crypto.subtle.encrypt', async () => {
      const readableStream = makeReadableStream({ numChunks, chunkSize });
      const reader = readableStream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, value);
      }
    });

  await bench.run();
  const table = bench.table();
  results[label] = table;
}

logger.log(results);
