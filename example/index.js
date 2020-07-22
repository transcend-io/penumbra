/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable require-jsdoc */
const files = [
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt',
  //   filePrefix: 'NYT',
  //   mimetype: 'text/plain',
  // },
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
  //   filePrefix: 'NYT',
  //   mimetype: 'text/plain',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: 'gadZhS1QozjEmfmHLblzbg==',
  //   },
  // },
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
  //   filePrefix: 'tortoise',
  //   mimetype: 'image/jpeg',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
  //   },
  // },
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/water.png.enc',
  //   filePrefix: 'water',
  //   mimetype: 'image/png',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: 'O7OO9ITvYg5EgdNdIVwbVw==',
  //   },
  // },
  {
    // url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/Earth.jpg.enc',
    url: '/Earth.jpg.enc',
    filePrefix: 'Earth',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'v86dSoD5yu4iaDZdPYWTDA==',
    },
  },
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/turtl.gif.enc',
  //   filePrefix: 'turtl',
  //   mimetype: 'image/gif',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: '6Q+67PfEE/4/qp9CPgR4Hg==',
  //   },
  // },
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/africa.topo.json.enc',
  //   filePrefix: 'africa.topo',
  //   mimetype: 'application/json',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: 'jw6UL2SQjOr0IwgF6TzxFA==',
  //   },
  // },
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/k.webm.enc',
  //   filePrefix: 'k',
  //   mimetype: 'video/webm',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
  //   },
  // },
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/river.jpg.enc',
  //   filePrefix: 'river',
  //   mimetype: 'image/jpeg',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: 'xdbXMuw8Q+uSnOYEXtMr4A==',
  //   },
  // },
  // {
  //   url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/patreon.mp4.enc',
  //   filePrefix: 'patreon',
  //   mimetype: 'video/mp4',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: 'Mqgmwj9IvLEeBjhwrkYpBg==',
  //   },
  // },
];

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

// This is all of the Penumbra-relevant code:
const onReady = async (
  { detail: { penumbra } } = {
    detail: self,
  },
) => {
  // Download and decrypt and display in table
  // TODO: fix demo table cell association
  penumbra
    .get(...files)
    .then((pfiles) => penumbra.getTextOrURI(pfiles))
    // .then(insertIntoCell);
    .then(insertIntoCell);

  const runOnce = {};
  // Display download progress
  window.addEventListener(
    'penumbra-progress',
    ({ detail: { percent, id, contentLength } }) => {
      const i = files.findIndex(
        (elt) => 'url' in elt && typeof id !== 'undefined' && elt.url === id,
      );
      if (i !== -1) {
        const cell = document.getElementById(`${i}-progress`);
        cell.innerText = `${percent}%`;

        if (!runOnce[i]) {
          const cell2 = document.getElementById(`${i}-size`);
          cell2.innerText = `${contentLength / 1000}KB`;
          runOnce[i] = true;
        }
      }
    },
  );

  // Function to download and zip
  // const downloadManyFiles = () =>
  //   penumbra.get(...files).then((pfiles) => penumbra.save(pfiles));
};

if (!self.penumbra) {
  self.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
