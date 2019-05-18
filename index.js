// External modules
import { saveAs } from 'file-saver';
import { createDecipheriv } from 'crypto-browserify';
import { createWriteStream } from 'streamsaver';
import toBuffer from 'typedarray-to-buffer';

function fetchAndDecipher(url, key, iv, authTag) {
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

function saveFile(rs, fileName) {
  // Feature detection for WritableStream
  if ('WritableStream' in window) return saveFileStream(rs, fileName);

  // No WritableStream; load into memory with a Blob
  return new Response(rs).blob().then(blob => saveAs(blob, fileName));
}

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
  pump().then(() => console.log('Closed the stream, Done writing'));
}


/**
 * Download, decrypt, and save a file
 * @param {string} url the URL to fetch the encrypted file from
 * @param {string} mime mime type: e.g. application/json
 * @param {string} fileName the filename to save it under
 * @param {string} key a base64 encoded decryption key
 * @param {string} iv a base64 encoded initialization vector
 * @param {string} authTag a base64 encoded authentication tag (for AES GCM)
 */
export function downloadEncryptedFile(url, mime, fileName, key, iv, authTag) {
  return (
    fetchAndDecipher(url, key, iv, authTag)
      // Stream the file to disk
      .then(rs => saveFile(rs, fileName))
      .catch(console.error)
  );
}

// Reads a stream into a Blob and creates a URL for use in an img src tag
function getMediaSrcFromRS(rs) {
  // return rs;
  return new Response(rs).blob().then(blob => URL.createObjectURL(blob));
}

// Reads a stream to completion and loads text
function getTextFromRS(rs) {
  return new Response(rs).text();
}

/**
 * Download, decrypt, and display a file in the browser
 */
export function getDecryptedContent(url, mime, key, iv, authTag) {
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

/**
 * felt cute might deprecate later
 * Download a string of text. If it's a JSON string it will be formatted.
 * @param {string} str text to save
 * @param {string} fileName the filename to save it under
 * @param {string} mime mime type: e.g. application/json
 */
export function downloadDisplayedText(str, fileName, mime) {
  try {
    str = JSON.stringify(JSON.parse(str), null, 2);
    mime = 'application/json';
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
  }

  const blob = new Blob([str], {
    type: `${mime || 'text/plain'};charset=utf-8`,
  });
  saveAs(blob, fileName);
}
