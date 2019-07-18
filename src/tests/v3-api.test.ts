import test from 'tape';

import penumbra from '../API';
import { ProgressEmit } from '../types';

import { hash, timeout } from './helpers';
import { TimeoutManager } from './helpers/timeout';

test('v3 API: decrypt', async (t) => {
  t.plan(2);
  const progressEventName = 'my-custom-event';
  const fail = () => {
    t.fail();
    t.end();
  };
  const initTimeout: TimeoutManager = timeout(fail, 60);
  let stallTimeout: TimeoutManager;
  let initFinished = false;
  let progressStarted = false;
  let lastPercent: number;
  const onprogress = (evt: ProgressEmit): void => {
    const { percent } = evt.detail;
    if (!Number.isNaN(percent)) {
      if (!initFinished) {
        initTimeout.clear();
        stallTimeout = timeout(fail, 10);
        initFinished = true;
        lastPercent = percent;
      } else if (!progressStarted) {
        if (percent > lastPercent) {
          stallTimeout.clear();
          progressStarted = true;
        }
      }
      if (progressStarted && percent > 25) {
        window.removeEventListener(progressEventName, onprogress);
        t.pass();
      }
    }
    lastPercent = percent;
  };

  window.addEventListener(progressEventName, onprogress);
  await penumbra.get({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/patreon.mp4.enc',
    mimetype: 'video/webm',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
    },
    progressEventName,
  });
  const decryptedText = await penumbra.getTextOrURI(
    await penumbra.get({
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
      filePrefix: 'NYT',
      mimetype: 'text/plain',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'gadZhS1QozjEmfmHLblzbg==',
      },
    }),
  );
  t.equal(
    await hash('SHA-256', new TextEncoder().encode(decryptedText)),
    '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5',
  );
});
