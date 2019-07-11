import { preconnect, preload } from '../fetchMany'

import test from 'tape';

/** Get the SHA-256 hash of an ArrayBuffer */
async function sha256(ab: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await ab));
  return digest.reduce((memo, i) => memo + i.toString(16).padStart(2, '0'), '');
};

test('preconnect', async (t) => {
  const measurePreconnects = () => document.querySelectorAll('link[rel="preconnect"]').length;
  const start = measurePreconnects();
  const cleanup = preconnect({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  });
  const after = measurePreconnects();
  cleanup();
  t.assert(start < after);
  t.end();
});

test('preload', async (t) => {
  const measurePreloads = () => document.querySelectorAll('link[rel="preload"]').length;
  const start = measurePreloads();
  const cleanup = preload({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  });
  const after = measurePreloads();
  cleanup();
  t.assert(start < after);
  t.end();
});
