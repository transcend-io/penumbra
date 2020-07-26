const SOURCE = 'https://s3-us-west-2.amazonaws.com/bencmbrook';
// const SOURCE = 'http://127.0.0.1:8081/files'; // used for development

window.files = [
  {
    url: `${SOURCE}/NYT.txt`,
    filePrefix: 'NYT',
    mimetype: 'text/plain',
  },
  {
    url: `${SOURCE}/NYT.txt.enc`,
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  },
  {
    url: `${SOURCE}/tortoise.jpg.enc`,
    filePrefix: 'tortoise',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  },
  {
    url: `${SOURCE}/water.png.enc`,
    filePrefix: 'water',
    mimetype: 'image/png',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'O7OO9ITvYg5EgdNdIVwbVw==',
    },
  },
  {
    url: `${SOURCE}/Earth.jpg.enc`,
    filePrefix: 'Earth',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'v86dSoD5yu4iaDZdPYWTDA==',
    },
  },
  {
    url: `${SOURCE}/turtl.gif.enc`,
    filePrefix: 'turtl',
    mimetype: 'image/gif',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: '6Q+67PfEE/4/qp9CPgR4Hg==',
    },
  },
  {
    url: `${SOURCE}/africa.topo.json.enc`,
    filePrefix: 'africa.topo',
    mimetype: 'application/json',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'jw6UL2SQjOr0IwgF6TzxFA==',
    },
  },
  {
    url: `${SOURCE}/k.webm.enc`,
    filePrefix: 'k',
    mimetype: 'video/webm',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
    },
  },
  {
    url: `${SOURCE}/river.jpg.enc`,
    filePrefix: 'river',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'xdbXMuw8Q+uSnOYEXtMr4A==',
    },
  },
  {
    url: `${SOURCE}/patreon.mp4.enc`,
    filePrefix: 'patreon',
    mimetype: 'video/mp4',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'Mqgmwj9IvLEeBjhwrkYpBg==',
    },
  },
  // {
  //   url: `${SOURCE}/deadmau5.mp4.enc`, // 2.4GB file, local development only
  //   filePrefix: 'deadmau5',
  //   mimetype: 'video/mp4',
  //   decryptionOptions: {
  //     key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //     iv: '6lNU+2vxJw6SFgse',
  //     authTag: 'PlaiFYDvjLRm4tkHitCdMQ=',
  //   },
  // },
];
