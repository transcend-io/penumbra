/* eslint-disable max-lines */
import test from 'tape';
import { PenumbraAPI, PenumbraReady, ProgressEmit } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import penumbra from '../API';
import { hash, timeout } from './helpers';
import { TimeoutManager } from './helpers/timeout';

const view = self;

let penumbra: PenumbraAPI;
test('setup', async (t) => {
  const onReady = async (event?: PenumbraReady) => {
    // eslint-disable-next-line no-shadow
    penumbra = ((event && event.detail.penumbra) ||
      view.penumbra) as PenumbraAPI;
    penumbra.setWorkerLocation('/build/');
    t.end();
  };

  if (!view.penumbra) {
    view.addEventListener('penumbra-ready', onReady);
  } else {
    onReady();
  }
});

test('penumbra.get() and penumbra.getTextOrURI() test', async (t) => {
  const cacheBuster = Math.random()
    .toString(10)
    .slice(2);
  await penumbra.setWorkerLocation(`penumbra.worker.js?${cacheBuster}`);
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
  const { type: test1Type, data: test1Text } = await penumbra.getTextOrURI(
    await penumbra.get(NYT),
  )[0];
  const test1Hash = await hash('SHA-256', new TextEncoder().encode(test1Text));
  const ref1Hash =
    '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5';

  t.equal(test1Type, 'text');
  t.equal(test1Hash, ref1Hash);
  t.end();
});

test('progress event test', async (t) => {
  let result;
  const progressEventName = 'penumbra-progress';
  const fail = () => {
    result = false;
  };
  const initTimeout = timeout(fail, 60);
  let stallTimeout: TimeoutManager;
  let initFinished = false;
  let progressStarted = false;
  let lastPercent: number;
  const onprogress = ({ detail: { percent } }: ProgressEmit) => {
    if (!Number.isNaN(percent)) {
      if (percent === 100) {
        // Resource is already loaded
        if (initFinished) {
          stallTimeout.clear();
        } else {
          initTimeout.clear();
        }
        view.removeEventListener(progressEventName, onprogress);
        result = true;
        return;
      }
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
        result = true;
      }
    }
    lastPercent = percent;
  };
  view.addEventListener(progressEventName, onprogress);
  const [{ stream }] = await penumbra.get({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/k.webm.enc',
    filePrefix: 'k',
    mimetype: 'video/webm',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
    },
  });
  await new Response(stream).arrayBuffer();

  t.ok(result);
  t.end();
});

test('penumbra.get() with multiple resources', async (t) => {
  const resources = await penumbra.get(
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
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
      filePrefix: 'tortoise',
      mimetype: 'image/jpeg',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
      },
    },
  );
  const hashes = await Promise.all(
    resources.map(async ({ stream }) =>
      hash('SHA-256', await new Response(stream).arrayBuffer()),
    ),
  );
  const referenceHash1 =
    '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5';
  const referenceHash2 =
    '1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95';

  t.equal(hashes[0], referenceHash1);
  t.equal(hashes[1], referenceHash2);
  t.end();
});

test('penumbra.get() images (as ReadableStream)', async (t) => {
  const [{ stream }] = await penumbra.get({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
    filePrefix: 'tortoise',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  });

  const imageBytes = await new Response(stream).arrayBuffer();
  const imageHash = await hash('SHA-256', imageBytes);
  const referenceHash =
    '1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95';

  t.equal(imageHash, referenceHash);
  t.end();
});

test('penumbra.getTextOrURI(): images (as URL)', async (t) => {
  const { type, data: url } = await penumbra.getTextOrURI(
    await penumbra.get({
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
      filePrefix: 'tortoise',
      mimetype: 'image/jpeg',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
      },
    }),
  )[0];
  let isURL;
  try {
    // tslint:disable-next-line: no-unused-expression
    new URL(url, location.href); // eslint-disable-line no-new
    isURL = type === 'uri';
  } catch (ex) {
    isURL = false;
  }
  const imageBytes = await fetch(url).then((r) => r.arrayBuffer());
  const imageHash = await hash('SHA-256', imageBytes);
  const referenceHash =
    '1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95';

  t.true(isURL);
  t.equal(imageHash, referenceHash);
  t.end();
});

test('penumbra.getTextOrURI(): including image in document', async (t) => {
  const { data: url } = await penumbra.getTextOrURI(
    await penumbra.get({
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
      filePrefix: 'tortoise',
      mimetype: 'image/jpeg',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
      },
    }),
  )[0];
  const testImage = new Image();
  const result = await new Promise((resolve) => {
    // 5-second timeout for the image to load
    timeout(() => resolve(false), 5);
    const onLoad = () => {
      testImage.removeEventListener('load', onLoad);
      testImage.remove();
      resolve(true);
    };
    const onError = () => {
      testImage.removeEventListener('error', onError);
      testImage.remove();
      resolve(false);
    };
    testImage.addEventListener('load', onLoad);
    testImage.addEventListener('error', onError);
    testImage.src = url;
    // testImage.style.visibility = 'hidden';
    // document.body.appendChild(testImage);
  });

  t.ok(result);
  t.end();
});

test('penumbra.getBlob()', async (t) => {
  const blob = await penumbra.getBlob(
    await penumbra.get({
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
      filePrefix: 'tortoise',
      mimetype: 'image/jpeg',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
      },
    }),
  );
  const imageBytes = await new Response(blob).arrayBuffer();
  const imageHash = await hash('SHA-256', imageBytes);
  const referenceHash =
    '1d9b02f0f26815e2e5c594ff2d15cb8a7f7b6a24b6d14355ffc2f13443ba6b95';

  t.equal(imageHash, referenceHash);
  t.end();
});

test('penumbra.encrypt() & penumbra.decrypt()', async (t) => {
  const { intoStream } = self;
  const te = new TextEncoder();
  const td = new TextDecoder();
  const data = 'test';
  const buffer = te.encode(data);
  const { byteLength: size } = buffer;
  const [encrypted] = await penumbra.encrypt(null, {
    stream: intoStream(buffer),
    size,
    mimetype: 'application/octet-stream',
    path: '/',
    filePrefix: 'data',
  });
  const options = await penumbra.getDecryptionInfo(encrypted);
  const [decrypted] = await penumbra.decrypt(options, encrypted);
  const decryptedBuffer = await new Response(decrypted.stream).arrayBuffer();
  t.equal(td.decode(decryptedBuffer), data);
  t.end();
});
