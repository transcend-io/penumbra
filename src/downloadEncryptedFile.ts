// external modules
import { saveAs } from 'file-saver';
import { extension } from 'mime-types';
// import { createWriteStream } from 'streamsaver';

// local
import fetchAndDecrypt from './fetchAndDecrypt';
import { RemoteResource } from './types';

/**
 * Streams a readable stream to disk
 *
 * @param rs - A stream of bytes to be saved to disk
 * @param fileName - The name of the file to save
 * @returns A promise saving the stream to file
 */
async function saveFileStream(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rs: ReadableStream,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fileName: string,
): Promise<void> {
  return undefined;
  // const fileStream = createWriteStream(fileName);
  // const writer = fileStream.getWriter();

  // // Feature detection for pipeTo (more efficient)
  // if (rs.pipeTo) {
  //   // like as we never did fileStream.getWriter()
  //   writer.releaseLock();
  //   return rs.pipeTo(fileStream);
  // }

  // const reader = rs.getReader();
  // const pump = (): Promise<void> =>
  //   reader.read().then(({ value, done }) =>
  //     done
  //       ? // Close the stream so we stop writing
  //         writer.close()
  //       : // Write one chunk, then get the next one
  //         writer.write(value).then(pump),
  //   );

  // // Start the reader
  // return pump();
}

/**
 * Saves a readable stream to disk from the browser
 *
 * @param rs - A stream of bytes to be saved to disk
 * @param fileName - The name of the file to save
 * @returns A promise saving to file
 */
export function saveFile(
  rs: ReadableStream,
  fileName: string,
): void | Promise<void> {
  // Feature detection for WritableStream - streams straight to disk
  // eslint-disable-next-line no-restricted-globals
  if ('WritableStream' in self) {
    return saveFileStream(rs, fileName);
  }

  // No WritableStream; load into memory with a Blob
  return new Response(rs).blob().then((blob) => saveAs(blob, fileName));
}

/**
 * Download an encrypted file
 *
 * @param resource - The resource file to download
 * @param fileName - The name of the file to save to
 * @returns A promise saving to file
 */
export default async function downloadEncryptedFile(
  resource: RemoteResource,
  fileName = `${resource.filePrefix}.${extension(resource.mimetype)}`,
): Promise<void> {
  const rs = await fetchAndDecrypt(resource);

  // Stream the file to disk
  return saveFile(rs, fileName);
}
