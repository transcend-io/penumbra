import fetchMany from '../fetchMany';

import test from 'tape';

/** Get the SHA-256 hash of an ArrayBuffer */
async function sha256(ab: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await ab));
  return digest.reduce((memo, i) => memo + i.toString(16).padStart(2, '0'), '');
};

test('fetchMany', async (t) => {
  const resources = await fetchMany({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  }, {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
    filePrefix: 'tortoise',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  });
  const hashes = await Promise.all(resources.map(async (rs) =>
    sha256(await new Response(rs).arrayBuffer())
  ));
  t.deepEqual(hashes, [
    "4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5",
    "1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95"
  ]);
  t.end();
});
