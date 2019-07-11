import getDecryptedContent from '../getDecryptedContent'
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
    decryptedText,
    // eslint-disable-next-line max-len
    'Since the mid-1970s, The New York Times has greatly expanded its layout and organization, adding special weekly sections on various topics supplementing the regular news, editorials, sports, and features. Since 2008,[15] the Times has been organized into the following sections: News, Editorials/Opinions-Columns/Op-Ed, New York (metropolitan), Business, Sports of The Times, Arts, Science, Styles, Home, Travel, and other features.[16] On Sunday, the Times is supplemented by the Sunday Review (formerly the Week in Review),[17] The New York Times Book Review,[18] The New York Times Magazine[19] and T: The New York Times Style Magazine.[20] The Times stayed with the broadsheet full-page set-up and an eight-column format for several years after most papers switched to six,[21] and was one of the last newspapers to adopt color photography, especially on the front page.',
  );
  t.end();
});

test('getDecryptedContent: images', async (t) => {
  console.log('a')
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
  const result = await sha256(imageBytes);
  t.equals(result, "1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95");
  t.end();
});

// Testing preconnect() and preload() is difficult with airtap alone

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
