import test from 'tape';

// import penumbra from '../API';
import {
  PenumbraAPI,
  PenumbraReady,
  PenumbraTextOrURI,
  ProgressEmit,
  RemoteResource,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import penumbra from '../API';
import { hash, timeout } from './helpers';
import { TimeoutManager } from './helpers/timeout';

const view = self;

const onReady = async (event?: PenumbraReady) => {
  // eslint-disable-next-line no-shadow
  const penumbra = ((event && event.detail.penumbra) ||
    view.penumbra) as PenumbraAPI;
  penumbra.setWorkerLocation('/build/');

  test('v3 API: progress', async (t) => {
    const progressEventName = 'penumbra-progress';
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
          view.removeEventListener(progressEventName, onprogress);
          t.pass('get() progress event test');
          t.end();
        }
      }
      lastPercent = percent;
    };

    view.addEventListener(progressEventName, onprogress);
    await penumbra.get({
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/patreon.mp4.enc',
      filePrefix: 'patreon',
      mimetype: 'video/webm',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
      },
    });
  });

  test('v3 API: save() single & multi-file (auto-zip)', async (t) => {
    // t.plan(2);
    t.plan(1);
    const NYT: RemoteResource = {
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
      filePrefix: 'NYT',
      mimetype: 'text/plain',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'gadZhS1QozjEmfmHLblzbg==',
      },
    };
    // This should save 'NYT.txt' (or 'download')
    await penumbra.save(await penumbra.get(NYT));
    t.pass('v3: API: save() single file');
    // // This should save 'download.zip'
    // await penumbra.save(await penumbra.get(NYT, NYT));
    // t.pass('v3: API: save() multiple files (auto-zip)');
    t.end();
  });

  test('v3 API: get() decrypt & getTextOrURI()', async (t) => {
    const { type, data } = await penumbra.getTextOrURI(
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
    )[0];
    t.equal(type, 'text');
    t.equal(
      await hash('SHA-256', new TextEncoder().encode(data)),
      '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5',
      'get() decryption test',
    );
    t.end();
  });

  // test('v3 API: zip()', async (t) => {
  //   const NYT: RemoteResource = {
  //     url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
  //     filePrefix: 'NYT',
  //     mimetype: 'text/plain',
  //     decryptionOptions: {
  //       key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
  //       iv: '6lNU+2vxJw6SFgse',
  //       authTag: 'gadZhS1QozjEmfmHLblzbg==',
  //     },
  //   };
  //   t.equal(
  //     await new Response(
  //       await penumbra.zip(await penumbra.get(NYT)),
  //     ).arrayBuffer(),
  //     'some SHA-256 hash',
  //     'v3 API: zip() output comparison',
  //   );
  //   t.end();
  // });

  test('v3 API: getBlob()', async (t) => {
    const NYT: RemoteResource = {
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
      filePrefix: 'NYT',
      mimetype: 'text/plain',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'gadZhS1QozjEmfmHLblzbg==',
      },
    };
    t.equal(
      // wait
      await new Response(
        await penumbra.getBlob(await penumbra.zip(await penumbra.get(NYT))),
      ).arrayBuffer(),
      'some SHA-256 hash',
      'v3 API: zip() output comparison',
    );
    t.end();
  });
};

if (!view.penumbra) {
  view.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
