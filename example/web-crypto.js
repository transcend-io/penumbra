/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable require-jsdoc */
const files = [
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
    filePrefix: 'tortoise',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/water.png.enc',
    filePrefix: 'water',
    mimetype: 'image/png',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'O7OO9ITvYg5EgdNdIVwbVw==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/Earth.jpg.enc',
    filePrefix: 'Earth',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'v86dSoD5yu4iaDZdPYWTDA==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/turtl.gif.enc',
    filePrefix: 'turtl',
    mimetype: 'image/gif',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: '6Q+67PfEE/4/qp9CPgR4Hg==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/africa.topo.json.enc',
    filePrefix: 'africa.topo',
    mimetype: 'application/json',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'jw6UL2SQjOr0IwgF6TzxFA==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/k.webm.enc',
    filePrefix: 'k',
    mimetype: 'video/webm',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/river.jpg.enc',
    filePrefix: 'river',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'xdbXMuw8Q+uSnOYEXtMr4A==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/patreon.mp4.enc',
    filePrefix: 'patreon',
    mimetype: 'video/mp4',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'Mqgmwj9IvLEeBjhwrkYpBg==',
    },
  },
];

const TEXT_TYPES = /^\s*(?:text\/\S*|application\/(?:xml|json)|\S*\/\S*\+xml|\S*\/\S*\+json)\s*(?:$|;)/i;

// const codecTester = document.createElementNS(
//   'http://www.w3.org/1999/xhtml',
//   'video',
// ) as HTMLMediaElement;

/**
 * Determine if the file mimetype is known for displaying
 *
 * @returns 'probably', 'maybe', or '' depending on if mime type can be displayed
 */
function isViewableText(mimetype) {
  const type = mimetype
    .split('/')[0]
    .trim()
    .toLowerCase();
  return type === 'text' || TEXT_TYPES.test(mimetype);
}

// Prepopulate the table with the file metadata, before they've downloaded
(function buildTable() {
  const table = document.getElementById('table');
  const headerIds = Array.from(document.getElementById('headers').children).map(
    (child) => child.id,
  );

  files.forEach((file, i) => {
    const row = document.createElement('tr');

    headerIds.forEach((headerId) => {
      const cell = document.createElement('td');
      cell.id = `${i}-${headerId}`;
      // Key-specific handlers
      if (headerId === 'decryptionOptions') {
        cell.innerText = !!file[headerId];
      } else {
        cell.innerText = file[headerId] || '';
      }
      row.appendChild(cell);
    });

    table.appendChild(row);
  });
})();

// Insert file info into the table
// @param returnedFiles: Promise<{ type: 'text'|'uri', data: string, mimetype: string }[]
function insertIntoCell(returnedFiles) {
  const headerIds = Array.from(document.getElementById('headers').children).map(
    (child) => child.id,
  );

  returnedFiles.forEach(async (returnedFile, i) => {
    const returnedFileObj = await returnedFile;
    Object.entries(returnedFileObj).forEach(([key, value]) => {
      if (!headerIds.includes(key)) {
        return;
      }
      const cell = document.getElementById(`${i}-${key}`);

      if (key === 'data' && returnedFileObj.type === 'uri') {
        // Display media
        const elementType = returnedFileObj.mimetype.split('/')[0];

        let media;
        if (elementType === 'image') {
          media = document.createElement('img');
        } else if (elementType === 'video') {
          media = document.createElement('video');
          media.autoplay = true;
          media.muted = true;
        }

        media.src = value;

        cell.appendChild(media);

        return;
      }
      cell.innerText = value.slice(0, 99);
    });
  });
}

// Decryption logic
const onReady = async () => {
  const output = [];
  const promises = files.map(async (file) => {
    const { url, filePrefix, mimetype, decryptionOptions } = file;

    // Fetch the encrypted file from S3
    const response = await fetch(url);
    // buffer everything to mem
    const blob = await response.blob();
    // convert to array buffer
    const buff = await blob.arrayBuffer();

    if (!decryptionOptions) {
      return output.push({
        type: 'text',
        data: 'Skipping the plaintext stuff',
        mimetype,
      });
    }

    // Function to convert base64-encoded string to Uint8Array
    const bufFromB64 = (str) =>
      Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

    const keyData = bufFromB64(decryptionOptions.key);
    const iv = bufFromB64(decryptionOptions.iv);
    const authTag = bufFromB64(decryptionOptions.authTag);

    const combined = new Uint8Array([...new Uint8Array(buff), ...authTag]);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      'AES-GCM',
      false,
      ['decrypt'],
    );

    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      combined,
    );

    // Return plaintext
    if (isViewableText(mimetype)) {
      const enc = new TextDecoder('utf-8');
      const decodedPlaintext = enc.decode(plaintext);
      return { type: 'text', data: decodedPlaintext, mimetype };
    }

    // Return URL
    const decryptedBlob = new Blob([plaintext], { type: mimetype });
    const decryptedUrl = URL.createObjectURL(decryptedBlob);
    return { type: 'uri', data: decryptedUrl, mimetype };
  });

  try {
    insertIntoCell(promises);
  } catch (err) {
    console.error(err);
  }
};

onReady();
