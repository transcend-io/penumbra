/* eslint-disable no-restricted-globals */
/* tslint:disable completed-docs */
// TODO Move this into a src folder and split functions into own files
// external modules
import { Decipher } from 'crypto';
import { createDecipheriv } from 'crypto-browserify';
import { saveAs } from 'file-saver';
import { createWriteStream } from 'streamsaver';
import * as toBuffer from 'typedarray-to-buffer';
const conflux = require('@transcend-io/conflux');

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

type FetchAndDecryptOptions = {
  // useServiceWorker?: boolean,
  alwaysBlob?: boolean;
  progressEventName?: string;
  url: string;
  key: string | Buffer;
  iv: string | Buffer;
  authTag: string | Buffer;
  mime: string;
};

/**
 * Fetches an encrypted file from a URL deciphers it, and returns a ReadableStream
 * @param options Options for the encrypted file being requested
 * @returns a readable stream of the deciphered file
 */
export function fetchAndDecipher(
  options: FetchAndDecryptOptions
): Promise<ReadableStream> {
  const {url, key, iv, authTag, progressEventName = url}
    = options;

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
 * Fetches encrypted files from provided URLs, deciphers it, and returns a ReadableStream
 * @param options Options for the encrypted files being requested
 * @returns a readable stream of the deciphered file
 */
export async function fetchAndDecrypt(
  ...resources: RemoteResource[]
): Promise<RemoteResource[] | ReadableStream | undefined> {
  return await fetchMany(...resources)
    .then((responses: RemoteResource[]) => {
      for (const resource of responses) {
        if (!resource.body) {
          throw new Error('Response body is empty!');
        }

        const contentLength = resource.headers && resource.headers.get('Content-Length');

        const {
          url, decryptionOptions: {
            key, iv, authTag, progressEventName = url
          }
        } = resource;

        // Convert to buffers
        const bufferKey = toBuff(key);
        const bufferIv = toBuff(iv);
        const bufferAuthTag = toBuff(authTag);

        // Construct the decipher
        const decipher = createDecipheriv('aes-256-gcm', bufferKey, bufferIv);
        decipher.setAuthTag(bufferAuthTag);

        return decryptStream(
          resource.body,
          decipher,
          +contentLength,
          url,
          progressEventName,
        );
      }
    });
}

/**
 * Initialize and open connections to origins that
 * will soon be requested to speed up connection setup.
 * This should speed up HTTP/2 connections, but not HTTP/1.1.
 * @param origins Origins to pre-connect to
 */
export function preconnect(...origins: string[]) {
  for (const origin of origins) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.appendChild(link);
  }
}

/**
 * Connect to and start loading URLs before they are
 * needed.
 * @param URLs URLs to preload
 */
export function preload(...URLs: string[]) {
  for (const url of URLs) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    document.head.appendChild(link);
  }
}

const origin_matcher = /^[\w-]+:\/{2,}\[?[\w\.:-]+\]?(?::[0-9]*)?/;

// Strip a url to get the origin
const cleanOrigin = (url: string): string => {
  const origin = url.match(origin_matcher);
  if (origin) {
    return origin[0];
  }
  return '';
};

type RemoteResource = {
  url: string;
  name?: string;
  path?: string;
  size?: number;
  decryptionOptions: FetchAndDecryptOptions;
  body?: ReadableStream<any> | null;
  headers?: Headers | any | null;
  mime?: any;
}

/**
 * Fetch multiple resources to be zipped. Annotates a RemoteResource
 * list with fetch responses.
 * @param resources ...
 * @usage fetchMany(...resources).then(zipAll)
 */
export async function fetchMany(...resources: RemoteResource[]): Promise<RemoteResource[]> {
  const requests: any[] = [];
  // for preconnect
  const origins: Set<string> = new Set();
  for (const resource of resources) {
    const { url, name, path = '/', size, decryptionOptions } = resource;
    if (!('name' in resource)) { // name can be ''
      const lastSlash = path.lastIndexOf('/');
      if (~lastSlash) {
        resource.name = path.substring(lastSlash);
        resource.path = path.substring(0, lastSlash);
      }
    }
    origins.add(cleanOrigin(url));
    requests.push(url);
  }

  preconnect(...origins);

  return Promise.all(
    requests.map(req => fetch(req).then(req => ({body: req.body, headers: req.headers})))
  ).then(responses =>
    responses.map(({body, headers}, i) => ({body: body, headers: headers, ...resources[i]}))
  );
};

// TODO: use https://github.com/transcend-io/conflux for zipping
/*export async function zipAll(...resources: RemoteResource[]): Promise<any> {
  const writer = conflux.writable.getWriter();

  for (const resource of resources) {
    writer.write(resource.body);
  }

  writer.close();
}*/

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

/**
 * Download an encrypted file
 *
 * @param options - FetchDecryptedContentOptions
 * @returns A promise saving to file
 */
export async function downloadEncryptedFile(
  options: FetchDecryptedContentOptions,
): Promise<void> {
  const {url, key, iv, authTag, progressEventName} = options;

  const fileFromUrlRegex = /(?!.*\/).+?(?=\.enc|\?|$)/;
  const fileName =
    options.fileName || (url.match(fileFromUrlRegex) || [])[0] || 'download';

  const rs = await fetchAndDecipher(options);

  // Stream the file to disk
  return saveFile(rs, fileName);
}

type FetchDecryptedContentOptions = {
  // useServiceWorker?: boolean,
  fileName?: string | null;
  alwaysBlob?: boolean;
  progressEventName?: string;
  url: string;
  key: string | Buffer;
  iv: string | Buffer;
  authTag: string | Buffer;
  mime: string;
};

/**
 * Get the contents of an encrypted file
 *
 * @param options - FetchDecryptedContentOptions
 * @returns The file contents
 */
export async function getDecryptedContent(
  options: FetchDecryptedContentOptions,
): Promise<string | Blob> {
  const {
    //url, key, iv, authTag,
    mime, alwaysBlob, progressEventName
  } = options;

  const type = mime.split('/')[0];

  const rs = await fetchAndDecipher(options);

  // Return the decrypted content
  if (!alwaysBlob) {
    if (type === 'image' || type === 'video' || type === 'audio') {
      return getMediaSrcFromRS(rs);
    }
    if (type === 'text' || mime === 'application/json') {
      return getTextFromRS(rs);
    }
  }
  return new Response(rs).blob();
}
