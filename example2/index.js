/* eslint-disable no-undef */
const files = {
  'NYT.txt': {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  },
  'tortoise.jpg': {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg',
    filePrefix: 'tortoise',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  },
};

penumbra
  .get(files['NYT.txt'])
  .then((pfiles) => penumbra.getTextOrURI(pfiles))
  .then(({ data, type }) => console.log(data, type));
