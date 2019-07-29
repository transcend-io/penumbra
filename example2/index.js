/* eslint-disable no-undef, no-restricted-globals */
const onReady = async ({ detail: { penumbra } } = { detail: self }) => {
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
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg',
      filePrefix: 'tortoise',
      mimetype: 'image/jpeg',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
      },
    },
  ];

  penumbra
    .get(...files)
    .then((pfiles) => penumbra.getTextOrURI(pfiles))
    .then((pfiles) => console.log(pfiles));
};

if (!self.penumbra) {
  self.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
