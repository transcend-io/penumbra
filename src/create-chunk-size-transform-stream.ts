const CHUNK_SIZE = 1024 * 1024 * 8; // 8 MiB
const HIGH_WATER_MARK = CHUNK_SIZE * 16; // 128 MiB

/**
 * Intended to be used to make smaller chunks when sending data to the Worker.
 *
 * When a user passes a huge chunk to the penumbra.encrypt() or penumbra.decrypt(),
 * it will result in a large, slow transfer to the worker, causing the output to wait.
 *
 * Side note TODO: can we instead just transfer the stream to the worker? Seems like remote-web-streams is copying.
 *
 * This transform stream splits the data into chunks of 8 MiB.
 * @returns A transform stream that chunks the data into 8 MiB chunks.
 */
export function createChunkSizeTransformStream(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  return new TransformStream<Uint8Array, Uint8Array>(
    {
      /**
       * Splits the data into chunks of 64 KiB.
       * @param chunk - The chunk of data to process.
       * @param controller - The controller to use to enqueue the processed data.
       */
      transform(chunk, controller) {
        const buf = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
        for (let index = 0; index < buf.length; index += CHUNK_SIZE) {
          controller.enqueue(buf.subarray(index, index + CHUNK_SIZE));
        }
      },
    },
    new ByteLengthQueuingStrategy({ highWaterMark: HIGH_WATER_MARK }),
    new ByteLengthQueuingStrategy({ highWaterMark: HIGH_WATER_MARK }),
  );
}
