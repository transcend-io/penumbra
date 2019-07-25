/**
 * Get the cryptographic hash of an ArrayBuffer
 *
 * @param ab - ArrayBuffer to digest
 * @param algorithm - Cryptographic hash digest algorithm
 * @returns Hexadecimal hash digest string
 */
async function hash(algorithm, ab) {
  const digest = new Uint8Array(
    await crypto.subtle.digest(algorithm, await ab),
  );
  return digest.reduce((memo, i) => memo + i.toString(16).padStart(2, '0'), '');
}

// eslint-disable-next-line no-restricted-globals
const view = self;

/** Penumbra has loaded */
const onReady = async (event) => {
  const penumbra = (event && event.detail) || view.penumbra;
  const cacheBuster = Math.random()
    .toString(10)
    .slice(2);
  await penumbra.setWorkerLocation({
    base: '/',
    decrypt: `decrypt.penumbra.worker.js?${cacheBuster}`,
    zip: `zip.penumbra.worker.js?${cacheBuster}`,
    StreamSaver: `streamsaver.penumbra.serviceworker.js?${cacheBuster}`,
  });
  const NYT = {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  };
  const text = await penumbra.getTextOrURI(await penumbra.get(NYT));
  console.log(text.type === 'text', `text.type === 'text'`);
  const test1Hash = await hash('SHA-256', new TextEncoder().encode(text.data));
  const ref1Hash =
    '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5';
  console.log(test1Hash === ref1Hash, `test1Hash === ref1Hash`);
};

if (!view.penumbra) {
  view.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
