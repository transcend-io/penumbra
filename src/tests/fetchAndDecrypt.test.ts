import test from 'tape';
import fetchAndDecrypt from '../fetchAndDecrypt';

/** Get the SHA-256 hash of an ArrayBuffer */
async function sha256(ab: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', await ab),
  );
  return digest.reduce((memo, i) => memo + i.toString(16).padStart(2, '0'), '');
}

test('fetchAndDecrypt', async (t) => {
  const resource = await fetchAndDecrypt({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  });
  const hash = await sha256(await new Response(resource).arrayBuffer());
  t.equals(
    hash,
    '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5',
  );
  t.end();
});
