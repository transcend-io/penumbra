import { Bench } from 'tinybench';
import {
  init,
  createEncryptStream,
  createDecryptStream,
} from '@bencmbrook/aes_gcm_stream';
import type { PenumbraAPI } from '../src/types';

globalThis.process = { env: { PENUMBRA_LOG_START: 'true' } } as any;
globalThis.isTest = true;
const scripts = document.createDocumentFragment();
const penumbraNode = document.createElement('script');
penumbraNode.async = true;
penumbraNode.defer = true;
penumbraNode.dataset.penumbra = '';
penumbraNode.dataset.worker = 'dist/worker.penumbra.js';
scripts.appendChild(penumbraNode);
document.body.appendChild(scripts);
// @ts-ignore
await import('../dist/main.penumbra.js');
const penumbra = globalThis.penumbra as PenumbraAPI;
console.log(penumbra);

// Initialize penumbra if it's not already initialized
if (!penumbra) {
  await new Promise((resolve) => {
    window.addEventListener('penumbra-ready', resolve);
  });
}

// Initialize the WASM module
await init();

// Create a key and nonce
const key = new Uint8Array(32);
const nonce = new Uint8Array(12);

// Crypto key
const cryptoKey = await crypto.subtle.importKey(
  'raw',
  key,
  { name: 'AES-GCM' },
  false,
  ['encrypt', 'decrypt'],
);

const NUM_CHUNKS = 1;
const CHUNK_SIZE = 1024;

function makeReadableStream(encoded = false): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (let index = 0; index < NUM_CHUNKS; index++) {
        const chunk = new Uint8Array(CHUNK_SIZE);
        for (let index = 0; index < chunk.length; index++) {
          chunk[index] = Math.floor(Math.random() * 1);
        }
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

// Benchmark
const bench = new Bench({
  name: 'simple benchmark',
  time: 100,
  // iterations: 10,
});
bench
  .add('aes_gcm_stream_wasm', async () => {
    // Streams
    const readableStream = makeReadableStream();
    const encryptStream = createEncryptStream(key, nonce);
    const decryptStream = createDecryptStream(key, nonce);

    await readableStream
      .pipeThrough(encryptStream)
      .pipeThrough(decryptStream)
      .pipeTo(new WritableStream());
  })
  .add(
    'crypto.subtle (cannot stream; use separately encrypted chunks)',
    async () => {
      const readableStream = makeReadableStream();
      const reader = readableStream.getReader();

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce },
          cryptoKey,
          value,
        );
        await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: nonce },
          cryptoKey,
          encrypted,
        );
      }
    },
  )
  .add('penumbra', async () => {
    const readableStream = makeReadableStream();
    const keyString = new TextDecoder().decode(key);
    const keyBase64 = btoa(keyString);

    const encrypted = await penumbra.encrypt(
      { key: keyBase64 },
      {
        stream: readableStream,
        size: CHUNK_SIZE * NUM_CHUNKS,
      },
    );
    const decryptionInfo = await penumbra.getDecryptionInfo(encrypted[0]);
    await penumbra.decrypt(decryptionInfo, encrypted[0]);
  });

await bench.run();
console.log(globalThis.penumbra);

const table = bench.table();
console.log(table);
