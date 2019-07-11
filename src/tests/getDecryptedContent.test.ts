import getDecryptedContent from '../getDecryptedContent';
import { ProgressEmit } from '../types';

import test from 'tape';

/** Get the SHA-256 hash of an ArrayBuffer */
async function sha256(ab: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await ab));
  return digest.reduce((memo, i) => memo + i.toString(16).padStart(2, '0'), '');
};

test('getDecryptedContent: text', async (t) => {
  const decryptedText = await getDecryptedContent({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  });
  t.equal(
    await sha256(new TextEncoder().encode(decryptedText as string)),
    '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5'
  );
  t.end();
});

test('getDecryptedContent: unencrypted content', async (t) => {
  const text = await getDecryptedContent({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
  });
  t.equal(
    await sha256(new TextEncoder().encode(text as string)),
    '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5'
  );
  t.end();
});

test('getDecryptedContent: images', async (t) => {
  const url = await getDecryptedContent({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
    filePrefix: 'tortoise',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  });
  let isURL = true;
  try {
    // tslint:disable-next-line: no-unused-expression
    new URL(url as string, location.href);
  } catch (ex) {
    isURL = false;
  }
  t.assert(isURL);
  const imageBytes = await fetch(url as string).then((r) => r.arrayBuffer());
  t.equals(await sha256(imageBytes), "1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95");
  t.end();
});

test('getDecryptedContent: Download Progress Event Emitter', async (t) => {
  const progressEventName = 'my-custom-event';
  const onprogress = (evt: ProgressEmit) => {
    t.assert(!isNaN(evt.detail.percent));
    t.end();
    removeEventListener(progressEventName, onprogress)
  };
  addEventListener(progressEventName, onprogress);
  await getDecryptedContent({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/k.webm.enc',
    filePrefix: 'k',
    mimetype: 'video/webm',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
    },
    progressEventName
  });
});
