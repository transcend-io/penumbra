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

let headerExists = false;
function appendRow(columnContent) {
  const table = document.getElementById('table');

  // Append a header row based on Object keys
  if (!headerExists) {
    const row = document.createElement('tr');
    Object.keys(columnContent).forEach((key) => {
      const header = document.createElement('th');
      header.innerText = key;
      row.appendChild(header);
    });
    table.appendChild(row);
    headerExists = true;
  }

  // Append a row
  const row = document.createElement('tr');
  Object.values(columnContent).forEach((value) => {
    const cell = document.createElement('td');
    cell.innerText = value.length > 100 ? `${value.slice(0, 96)}...` : value;
    row.appendChild(cell);
  });
  table.appendChild(row);
}

let downloadManyFiles;
const onReady = async ({ detail: { penumbra } } = { detail: self }) => {
  penumbra
    .get(...files)
    .then((pfiles) => penumbra.getTextOrURI(pfiles))
    .then((textOrURIs) =>
      textOrURIs.forEach((textOrURI) => appendRow(textOrURI)),
    );

  downloadManyFiles = () =>
    penumbra.get(...files).then((pfiles) => penumbra.zip(pfiles));
};

if (!self.penumbra) {
  self.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
