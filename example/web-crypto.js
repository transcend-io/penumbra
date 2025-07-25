const TEXT_TYPES =
  /^\s*(?:text\/\S*|application\/(?:xml|json)|\S*\/\S*\+xml|\S*\/\S*\+json)\s*(?:$|;)/i;

/**
 * Determine if the file mimetype is known for displaying
 * @param mimetype - The mimetype of the file
 * @returns 'probably', 'maybe', or '' depending on if mime type can be displayed
 */
function isViewableText(mimetype) {
  const type = mimetype.split('/')[0].trim().toLowerCase();
  return type === 'text' || TEXT_TYPES.test(mimetype);
}

// Helper to decode arraybuffer to text
const enc = new TextDecoder('utf-8');

// Decryption logic
const onReady = async () => {
  // Wait for files to be loaded
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.files.length > 0) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });

  const promises = window.files.map(async (file) => {
    const { url, mimetype, decryptionOptions } = file;

    // Fetch the encrypted file from S3
    const response = await fetch(url);
    // buffer everything to memory
    const blob = await response.blob();
    // convert to array buffer
    const buff = await blob.arrayBuffer();

    let plaintext;
    if (!decryptionOptions) {
      // It's not encrypted
      plaintext = buff;
    } else {
      // Function to convert base64-encoded string to Uint8Array
      const bufFromB64 = (str) =>
        Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

      const keyData = bufFromB64(decryptionOptions.key);
      const iv = bufFromB64(decryptionOptions.iv);
      const authTag = bufFromB64(decryptionOptions.authTag);

      // Append the 16 byte auth tag to the ciphertext
      const combined = new Uint8Array([...new Uint8Array(buff), ...authTag]);

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        'AES-GCM',
        false,
        ['decrypt'],
      );

      plaintext = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        combined,
      );
    }

    // Return decoded plaintext
    if (isViewableText(mimetype)) {
      const decodedPlaintext = enc.decode(plaintext);
      return { type: 'text', data: decodedPlaintext, mimetype };
    }

    // Return URL
    const decryptedBlob = new Blob([plaintext], { type: mimetype });
    const decryptedUrl = URL.createObjectURL(decryptedBlob);
    return { type: 'uri', data: decryptedUrl, mimetype };
  });

  try {
    window.insertIntoCell(promises);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
};

onReady();
