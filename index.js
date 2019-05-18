// External modules
import { saveAs } from 'file-saver';
import { createDecipheriv } from 'crypto-browserify';
import { createWriteStream } from 'streamsaver';
import toBuffer from 'typedarray-to-buffer';


/**
 * Fetches an encrypted file from a URL deciphers it, and returns a ReadableStream
 * @param {String} url the URL to fetch an encrypted file from
 * @param {string|Buffer} key the decryption key to use for this encrypted file, as a Buffer or base64-encoded string
 * @param {string|Buffer} iv the initialization vector for this encrypted file, as a Buffer or base64-encoded string
 * @param {string|Buffer} authTag the authentication tag for this encrypted file, as a Buffer or base64-encoded string
 * @return {ReadableStream} a readable stream of the deciphered file
 */
function fetchAndDecipher(url, key, iv, authTag) {
  if (typeof key === 'string') key = Buffer.from(key, 'base64');
  if (typeof iv === 'string') iv = Buffer.from(iv, 'base64');
  if (typeof authTag === 'string') authTag = Buffer.from(authTag, 'base64');

  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'base64'),
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  return (
    fetch(url)
      // Retrieve its body as ReadableStream
      .then(response => {
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
 * @param {Number} totalBytesRead the number of bytes read so far
 * @param {Number} contentLength the total number of bytes to read
 * @param {String} url the URL being read from
 * @return {void}
 */
function emitProgress(totalBytesRead, contentLength, url) {
  const percent = Math.round((totalBytesRead / contentLength) * 100);
  const event = new CustomEvent(url, {
    detail: {
      percent,
      totalBytesRead,
      contentLength,
    },
  });
  window.dispatchEvent(event);
}


/**
 * Decrypts a readable stream
 * @param {ReadableStream} rs a readable stream of encrypted data
 * @param {Decipher} decipher the crypto module's decipher
 * @param {Number} contentLength the content length of the file, in bytes
 * @param {string} url the URL to read the encrypted file from (only used for the event emitter)
 * @return {ReadableStream} a readable stream of decrypted data
 */
function decryptStream(rs, decipher, contentLength, url) {
  // TODO check authTag with decipher.final

  let totalBytesRead = 0;

  // TransformStreams are supported
  if ('TransformStream' in window) {
    return rs.pipeThrough(
      new window.TransformStream({
        transform: async (chunk, controller) => {
          try {
            chunk = toBuffer(chunk);
          } catch (err) {
            console.error(err);
          }

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
 * @param {ReadableStream} rs a stream of bytes to be saved to disk
 * @param {string} fileName the name of the file to save
 * @return {void|Promise<void>}
 */
function saveFile(rs, fileName) {
  // Feature detection for WritableStream - streams straight to disk
  if ('WritableStream' in window) return saveFileStream(rs, fileName);

  // No WritableStream; load into memory with a Blob
  return new Response(rs).blob().then(blob => saveAs(blob, fileName));
}


/**
 * Streams a readable stream to disk
 * @param {ReadableStream} rs a stream of bytes to be saved to disk
 * @param {string} fileName the name of the file to save
 * @return {Promise<void>}
 */
function saveFileStream(rs, fileName) {
  const fileStream = createWriteStream(fileName);
  const writer = fileStream.getWriter();

  // Feature detection for pipeTo (more efficient)
  if (rs.pipeTo) {
    // like as we never did fileStream.getWriter()
    writer.releaseLock();
    return rs.pipeTo(fileStream);
  }

  const reader = rs.getReader();
  const pump = () =>
    reader.read().then(({ value, done }) =>
      done
        ? // close the stream so we stop writing
          writer.close()
        : // Write one chunk, then get the next one
          writer.write(value).then(pump)
    );

  // Start the reader
  return pump();
}


/**
 * Returns an object URL to display media directly on a webpage
 * @param {ReadableStream} rs a readable stream of decrypted bytes
 * @return {string} the object URL to be added to an src attribute/prop
 */
function getMediaSrcFromRS(rs) {
  // return rs;
  return new Response(rs).blob().then(blob => URL.createObjectURL(blob));
}


/**
 * Reads a stream to completion and returns the underlying text
 * @param {ReadableStream} rs a readable stream of decrypted bytes
 * @return {string} the decrypted text
 */
function getTextFromRS(rs) {
  return new Response(rs).text();
}


/**
 * Download, decrypt, and save a file
 * @param {string} url the URL to fetch the encrypted file from
 * @param {string} key a base64 encoded decryption key
 * @param {string} iv a base64 encoded initialization vector
 * @param {string} authTag a base64 encoded authentication tag (for AES GCM)
 * @param {Object?} options mime, fileName
 * @return {Promise<void>}
 */
export function downloadEncryptedFile(url, key, iv, authTag, options = {}) {
  const fileName = options.fileName || url.match(/(?!.*\/).+?(?=\.enc|\?|$)/)[0];

  return (
    fetchAndDecipher(url, key, iv, authTag)
      // Stream the file to disk
      .then(rs => saveFile(rs, fileName))
  );
}


/**
 * Download, decrypt, and return string or object URL to display directly on the webpage
 * @param {string} url the URL to fetch an encrypted file from
 * @param {string|Buffer} key the decryption key to use for this encrypted file, as a Buffer or base64-encoded string
 * @param {string|Buffer} iv the initialization vector for this encrypted file, as a Buffer or base64-encoded string
 * @param {string|Buffer} authTag the authentication tag for this encrypted file, as a Buffer or base64-encoded string
 * @param {string} mime the mime type of the underlying file
 * @return {Promise<string>} depending on mime type, a string of text, or an src if it's media
 */
export function getDecryptedContent(url, key, iv, authTag, mime) {
  const type = mime.split('/')[0];

  return fetchAndDecipher(url, key, iv, authTag)
    .then(rs => {
      if (type === 'image' || type === 'video' || type === 'audio')
        return getMediaSrcFromRS(rs);
      if (type === 'text' || mime === 'application/json')
        return getTextFromRS(rs);
      else return new Response(rs).blob();
    })
}