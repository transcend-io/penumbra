// External modules
import { saveAs } from 'file-saver';
import { createDecipheriv } from 'crypto-browserify';
import { createWriteStream } from 'streamsaver';
import * as toBuffer from 'typedarray-to-buffer';

// Types
import { Decipher } from 'crypto';


/**
 * Fetches an encrypted file from a URL deciphers it, and returns a ReadableStream
 * @param url the URL to fetch an encrypted file from
 * @param key the decryption key to use for this encrypted file, as a Buffer or base64-encoded string
 * @param iv the initialization vector for this encrypted file, as a Buffer or base64-encoded string
 * @param authTag the authentication tag for this encrypted file, as a Buffer or base64-encoded string
 * @returns a readable stream of the deciphered file
 */
function fetchAndDecipher(
  url: string,
  key: string | Buffer,
  iv: string | Buffer,
  authTag: string | Buffer,
): Promise<ReadableStream> {
  if (typeof key === 'string') key = Buffer.from(key, 'base64');
  if (typeof iv === 'string') iv = Buffer.from(iv, 'base64');
  if (typeof authTag === 'string') authTag = Buffer.from(authTag, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);

  decipher.setAuthTag(authTag);

  return (
    fetch(url)
      // Retrieve its body as ReadableStream
      .then(response => {
        if (response.body === null) throw new Error('Response body is empty!');

        const contentLength = response.headers.get('Content-Length');
        return decryptStream(
          response.body,
          decipher,
          Number(contentLength),
          url
        );
      })
  );
}


/**
 * An event emitter for the decryption progress
 * @param totalBytesRead the number of bytes read so far
 * @param contentLength the total number of bytes to read
 * @param url the URL being read from
 * @returns
 */
function emitProgress(
  totalBytesRead: number,
  contentLength: number,
  url: string,
): void {
  const percent = Math.round((totalBytesRead / contentLength) * 100);
  const event = new CustomEvent(url, {
    detail: {
      percent,
      totalBytesRead,
      contentLength,
    },
  });
  self.dispatchEvent(event);
}


/**
 * Decrypts a readable stream
 * @param rs a readable stream of encrypted data
 * @param decipher the crypto module's decipher
 * @param contentLength the content length of the file, in bytes
 * @param url the URL to read the encrypted file from (only used for the event emitter)
 * @returns a readable stream of decrypted data
 */
function decryptStream(
  rs: ReadableStream,
  decipher: Decipher,
  contentLength: number,
  url: string,
): ReadableStream {
  // TODO check authTag with decipher.final

  let totalBytesRead = 0;

  // TransformStreams are supported
  if ('TransformStream' in self) {
    return rs.pipeThrough(
      new TransformStream({
        transform: async (chunk, controller) => {
          chunk = toBuffer(chunk);

          // Decrypt chunk and send it out
          const decryptedChunk = decipher.update(chunk);
          controller.enqueue(decryptedChunk);

          // Emit a progress update
          totalBytesRead += chunk.length;
          emitProgress(totalBytesRead, contentLength, url);
        },
      })
    );
  }

  // TransformStream not supported, revert to ReadableStream
  const reader = rs.getReader();
  return new ReadableStream({
    start(controller) {
      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }

          const chunk = toBuffer(value);

          // Decrypt chunk
          const decValue = decipher.update(chunk);

          // Emit a progress update
          totalBytesRead += chunk.length;
          emitProgress(totalBytesRead, contentLength, url);

          controller.enqueue(decValue);
          push();
        });
      }
      push();
    },
  });
}


/**
 * Saves a readable stream to disk from the browser
 * @param rs a stream of bytes to be saved to disk
 * @param fileName the name of the file to save
 * @returns
 */
function saveFile(
  rs: ReadableStream,
  fileName: string,
): void | Promise<void> {
  // Feature detection for WritableStream - streams straight to disk
  if ('WritableStream' in self) return saveFileStream(rs, fileName);

  // No WritableStream; load into memory with a Blob
  return new Response(rs).blob().then(blob => saveAs(blob, fileName));
}


/**
 * Streams a readable stream to disk
 * @param rs a stream of bytes to be saved to disk
 * @param fileName the name of the file to save
 * @returns
 */
function saveFileStream(
  rs: ReadableStream,
  fileName: string,
): Promise<void> {
  const fileStream = createWriteStream(fileName);
  const writer = fileStream.getWriter();

  // Feature detection for pipeTo (more efficient)
  if (rs.pipeTo) {
    // like as we never did fileStream.getWriter()
    writer.releaseLock();
    return rs.pipeTo(fileStream);
  }

  const reader = rs.getReader();
  const pump = (): Promise<void> =>
    reader.read().then(({ value, done }) =>
      done
        // Close the stream so we stop writing
        ? writer.close()
        // Write one chunk, then get the next one
        : writer.write(value).then(pump)
    );

  // Start the reader
  return pump();
}


/**
 * Returns an object URL to display media directly on a webpage
 * @param rs a readable stream of decrypted bytes
 * @returns the object URL to be added to an src attribute/prop
 */
function getMediaSrcFromRS(rs: ReadableStream): Promise<string> {
  // return rs;
  return new Response(rs).blob().then(blob => URL.createObjectURL(blob));
}


/**
 * Reads a stream to completion and returns the underlying text
 * @param rs a readable stream of decrypted bytes
 * @returns the decrypted text
 */
function getTextFromRS(rs: ReadableStream): Promise<string> {
  return new Response(rs).text();
}


/**
 * Download, decrypt, and save a file
 * @param url the URL to fetch the encrypted file from
 * @param key a base64 encoded decryption key
 * @param iv a base64 encoded initialization vector
 * @param authTag a base64 encoded authentication tag (for AES GCM)
 * @param options mime, fileName
 * @returns
 */

interface DownloadEncryptedFileOptions {
  fileName?: string | null;
}

export async function downloadEncryptedFile(
  url: string,
  key: string | Buffer,
  iv: string | Buffer,
  authTag: string | Buffer,
  options: DownloadEncryptedFileOptions = {}
): Promise<void> {
  const fileFromUrlRegex = /(?!.*\/).+?(?=\.enc|\?|$)/;
  const fileName = options.fileName || (url.match(fileFromUrlRegex) || [])[0] || 'download';

  const rs = await fetchAndDecipher(url, key, iv, authTag);

  // Stream the file to disk
  return saveFile(rs, fileName);
}


/**
 * Download, decrypt, and return string, object URL, or Blob to display directly on the webpage
 * @param url the URL to fetch an encrypted file from
 * @param key the decryption key to use for this encrypted file, as a Buffer or base64-encoded string
 * @param iv the initialization vector for this encrypted file, as a Buffer or base64-encoded string
 * @param authTag the authentication tag for this encrypted file, as a Buffer or base64-encoded string
 * @param mime the mime type of the underlying file
 * @returns depending on mime type, a string of text, or an src if it's media
 */
interface GetDecryptedContentOptions {
  useServiceWorker?: boolean,
}

export async function getDecryptedContent(
  url: string,
  key: string | Buffer,
  iv: string | Buffer,
  authTag: string | Buffer,
  mime: string,
  options: GetDecryptedContentOptions,
): Promise<string | Blob> {
  const type = mime.split('/')[0];

  const rs = await fetchAndDecipher(url, key, iv, authTag);

  // Return the decrypted content
  if (type === 'image' || type === 'video' || type === 'audio') return getMediaSrcFromRS(rs);
  if (type === 'text' || mime === 'application/json') return getTextFromRS(rs);
  return new Response(rs).blob();
}
