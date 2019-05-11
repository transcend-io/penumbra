// External modules
import { saveAs } from 'file-saver';

// Util
import { saveFile, fetchAndDecipher } from './util';

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
