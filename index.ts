/* eslint-disable no-restricted-globals */
/* tslint:disable completed-docs */
// TODO Move this into a src folder and split functions into own files
// external modules
import { Decipher } from 'crypto';
import { createDecipheriv } from 'crypto-browserify';
import { saveAs } from 'file-saver';
import { createWriteStream } from 'streamsaver';
import * as toBuffer from 'typedarray-to-buffer';

/**
 * Convert to buffer
 * @param i
 */
const toBuff = (i: Buffer | string): Buffer =>
  typeof i === 'string' ? Buffer.from(i, 'base64') : i;

/**
 * The type that is emitted as progress continues
 */
export type ProgressEmit = {
  /** Detailed emit */
  detail: {
    /** Percentage completed */
    percent: number;
    /** Total bytes read */
    totalBytesRead: number;
    /** Total number of bytes to read */
    contentLength: number;
    /** The URL downloading from */
    url: string;
  };
};

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
  progressEventName: string = url,
): void {
  const percent = Math.round((totalBytesRead / contentLength) * 100);
  const emitContent: ProgressEmit = {
    detail: {
      percent,
      totalBytesRead,
      contentLength,
      url,
    },
  };
  const event = new CustomEvent(progressEventName, emitContent);
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
  progressEventName?: string,
): ReadableStream {
  // TODO check authTag with decipher.final

  let totalBytesRead = 0;

  // TransformStreams are supported
  if ('TransformStream' in self) {
    return rs.pipeThrough(
      // eslint-disable-next-line no-undef
      new TransformStream({
        transform: async (chunk, controller) => {
          const bufferChunk = toBuffer(chunk);

          // Decrypt chunk and send it out
          const decryptedChunk = decipher.update(bufferChunk);
          controller.enqueue(decryptedChunk);

          // Emit a progress update
          totalBytesRead += bufferChunk.length;
          emitProgress(totalBytesRead, contentLength, url, progressEventName);
        },
      }),
    );
  }

  // TransformStream not supported, revert to ReadableStream
  const reader = rs.getReader();
  return new ReadableStream({
    /**
     * Controller
     */
    start(controller) {
      /**
       * Push on
       */
      function push(): void {
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
          emitProgress(totalBytesRead, contentLength, url, progressEventName);

          controller.enqueue(decValue);
          push();
        });
      }
      push();
    },
  });
}
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
  progressEventName?: string,
): Promise<ReadableStream> {
  // Convert to buffers
  const bufferKey = toBuff(key);
  const bufferIv = toBuff(iv);
  const bufferAuthTag = toBuff(authTag);

  // Construct the decipher
  const decipher = createDecipheriv('aes-256-gcm', bufferKey, bufferIv);
  decipher.setAuthTag(bufferAuthTag);

  return (
    fetch(url)
      // Retrieve its body as ReadableStream
      .then((response) => {
        if (response.body === null) {
          throw new Error('Response body is empty!');
        }

        const contentLength = response.headers.get('Content-Length');
        return decryptStream(
          response.body,
          decipher,
          Number(contentLength),
          url,
          progressEventName,
        );
      })
  );
}

/**
 * Initialize and open connections to origins that
 * will soon be requested to speed up connection setup.
 * This should speed up HTTP/2 connections, but not HTTP/1.1.
 * @param ...origins Origin to pre-connect to
 */
export function preconnect() {
  for (let origin of arguments) {
    let link = document.createElement('link');
    link.rel = origin;
    document.head.appendChild(link);
  }
}

const origin_matcher = /^[\w-]+:\/{2,}\[?[\w\.:-]+\]?(?::[0-9]*)?/;

// Strip a url to get the origin
const cleanOrigin = (url: string): string => {
  const origin = url.match(origin_matcher);
  if (origin) {
    return origin[0];
  } else {
    return '';
  }
}

/**
 * Fetch multiple resources to be zipped
 * @param resources ...
 * @usage fetchMany(resources).then(zipAll)
*/
export async function fetchMany(...resources: any[]) {
  const requests:Promise<void>[] = [];
  // for preconnect
  const origins:any = new Set;
  for (let resource of resources) {
    let {url, name, path, size, decryptionOptions} = resource;
    if (!name) {
      let lastSlash = path.lastIndexOf("/");
      if (~lastSlash) {
        resource.name = path.substring(lastSlash);
        resource.path = path.substring(0, lastSlash);
      }
    }
    origins.add(cleanOrigin(url));
  }

  preconnect(...origins);

  return Promise.all(requests
    .map(req => fetch(req.url))
    //.then(req => {
    //  req.body
    //})
  ).then(response => {
    ;
  });
}

export async function zipAll(files: File[]) {
  const zip = new ZIP({
    start(ctrl) {
      for (let file of files) {
        ctrl.enqueue(file);
      }
      ctrl.close();
    }
  });
}

/**
 * Streams a readable stream to disk
 * @param rs a stream of bytes to be saved to disk
 * @param fileName the name of the file to save
 * @returns
 */
function saveFileStream(rs: ReadableStream, fileName: string): Promise<void> {
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
        ? // Close the stream so we stop writing
          writer.close()
        : // Write one chunk, then get the next one
          writer.write(value).then(pump),
    );

  // Start the reader
  return pump();
}

/**
 * Saves a readable stream to disk from the browser
 * @param rs a stream of bytes to be saved to disk
 * @param fileName the name of the file to save
 * @returns
 */
function saveFile(rs: ReadableStream, fileName: string): void | Promise<void> {
  // Feature detection for WritableStream - streams straight to disk
  if ('WritableStream' in self) {
    return saveFileStream(rs, fileName);
  }

  // No WritableStream; load into memory with a Blob
  return new Response(rs).blob().then((blob) => saveAs(blob, fileName));
}

/**
 * Returns an object URL to display media directly on a webpage
 * @param rs a readable stream of decrypted bytes
 * @returns the object URL to be added to an src attribute/prop
 */
function getMediaSrcFromRS(rs: ReadableStream): Promise<string> {
  // return rs;
  return new Response(rs).blob().then((blob) => URL.createObjectURL(blob));
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

type DownloadEncryptedFileOptions = {
  fileName?: string | null;
  progressEventName?: string;
};

/**
 * Download an encrpyted file
 *
 * @param url - The url to download from
 * @param key - The CEK
 * @param iv - The file iv
 * @param authTag - The auth tag
 * @param options - Additional options
 * @returns A promise saving to file
 */
export async function downloadEncryptedFile(
  url: string,
  key: string | Buffer,
  iv: string | Buffer,
  authTag: string | Buffer,
  options: DownloadEncryptedFileOptions = {},
): Promise<void> {
  const fileFromUrlRegex = /(?!.*\/).+?(?=\.enc|\?|$)/;
  const fileName =
    options.fileName || (url.match(fileFromUrlRegex) || [])[0] || 'download';

  const rs = await fetchAndDecipher(
    url,
    key,
    iv,
    authTag,
    options.progressEventName,
  );

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
type GetDecryptedContentOptions = {
  // useServiceWorker?: boolean,
  alwaysBlob?: boolean;
  progressEventName?: string;
};

/**
 * Get the contents of an encrypted file
 *
 * @param url - The url to download from
 * @param key - The CEK
 * @param iv - The file iv
 * @param authTag - The auth tag
 * @param mime - The mimetype of the file
 * @param options - File options
 * @returns The file contents
 */
export async function getDecryptedContent(
  url: string,
  key: string | Buffer,
  iv: string | Buffer,
  authTag: string | Buffer,
  mime: string,
  options: GetDecryptedContentOptions = {},
): Promise<string | Blob> {
  const type = mime.split('/')[0];

  const rs = await fetchAndDecipher(
    url,
    key,
    iv,
    authTag,
    options.progressEventName,
  );

  // Return the decrypted content
  if (!options.alwaysBlob) {
    if (type === 'image' || type === 'video' || type === 'audio') {
      return getMediaSrcFromRS(rs);
    }
    if (type === 'text' || mime === 'application/json') {
      return getTextFromRS(rs);
    }
  }
  return new Response(rs).blob();
}
