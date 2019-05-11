// External modules
import { createDecipheriv } from 'crypto-browserify';
import { createWriteStream } from 'streamsaver';
import { saveAs } from 'file-saver';

export function fetchAndDecipher(url, key, iv, authTag) {
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

          // Decrypt value
          const decValue = decipher.update(value);

          // Emit a progress update
          totalBytesRead += value.length;
          emitProgress(totalBytesRead, contentLength, url);

          controller.enqueue(decValue);
          push();
        });
      }
      push();
    },
  });
}

export function saveFile(rs, fileName) {
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
