/* eslint-disable max-lines */
import test from 'tape';
import {
  PenumbraAPI,
  PenumbraFile,
  PenumbraReady,
  ProgressEmit,
} from '../types';
import { PenumbraSupportLevel } from '../enums';

import { hash, timeout } from './helpers';
import { TimeoutManager } from './helpers/timeout';
import { logger } from '../logger';

const view = self;

let penumbra: PenumbraAPI;

test('setup', (t) => {
  const onReady = (event?: PenumbraReady): void => {
    penumbra = ((event && event.detail.penumbra) ||
      view.penumbra) as PenumbraAPI;
    t.pass('setup finished');
    t.end();
  };

  if (!view.penumbra) {
    view.addEventListener('penumbra-ready', onReady);
  } else {
    onReady();
  }
});

test('penumbra.supported() test', (t): void => {
  t.assert(
    penumbra.supported() >= PenumbraSupportLevel.size_limited,
    'penumbra.supported() is PenumbraSupportLevel.size_limited or PenumbraSupportLevel.full',
  );
  t.end();
});

test('penumbra.get() and penumbra.getTextOrURI() test', async (t) => {
  if (!self.TextEncoder) {
    logger.warn('skipping test due to lack of browser support for TextEncoder');
    t.pass('test skipped');
    t.end();
    return;
  }
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
  const test1Hash = await hash(
    'SHA-256',
    new self.TextEncoder().encode(test1Text),
  );
  const ref1Hash =
    '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5';

  t.equal(test1Type, 'text');
  t.equal(test1Hash, ref1Hash);
  t.end();
});

test('progress event test', async (t) => {
  let result;
  const progressEventName = 'penumbra-progress';
  const fail = (): void => {
    result = false;
  };
  const initTimeout = timeout(fail, 60);
  let stallTimeout: TimeoutManager;
  let initFinished = false;
  let progressStarted = false;
  let lastPercent: number;
  const onprogress = ({ detail: { percent } }: ProgressEmit): void => {
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
    const onLoad = (): void => {
      testImage.removeEventListener('load', onLoad);
      testImage.remove();
      resolve(true);
    };
    const onError = (): void => {
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

test('penumbra.preconnect()', (t) => {
  const measurePreconnects = (): number =>
    document.querySelectorAll('link[rel="preconnect"]').length;
  const start = measurePreconnects();
  const cleanup = penumbra.preconnect({
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

test('penumbra.preload()', (t): void => {
  const measurePreloads = (): number =>
    document.querySelectorAll(
      'link[rel="preload"][as="fetch"][crossorigin="use-credentials"]',
    ).length;
  const start = measurePreloads();
  const cleanup = penumbra.preload({
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

test('penumbra.getBlob()', async (t) => {
  const blob = await penumbra.getBlob(
    await penumbra.get({
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
      filePrefix: 'test/tortoise.jpg',
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
  if (!self.TextEncoder || !self.TextDecoder) {
    logger.warn(
      'skipping test due to lack of browser support for TextEncoder/TextDecoder',
    );
    t.pass('test skipped');
    t.end();
    return;
  }
  const te = new self.TextEncoder();
  const td = new self.TextDecoder();
  const input = 'test';
  const buffer = te.encode(input);
  const { byteLength: size } = buffer;
  const stream = new Response(buffer).body;
  const options = null;
  const file = { stream, size } as unknown as PenumbraFile;
  const [encrypted] = await penumbra.encrypt(options, file);
  const decryptionInfo = await penumbra.getDecryptionInfo(encrypted);
  const [decrypted] = await penumbra.decrypt(decryptionInfo, encrypted);
  const decryptedData = await new Response(decrypted.stream).arrayBuffer();
  t.equal(td.decode(decryptedData), input);
  t.end();
});

test('penumbra.saveZip({ saveBuffer: true }) - getBuffer(), getSize() and auto-renaming', async (t) => {
  const expectedReferenceHashes = [
    '318e197f7df584c339ec6d06490eb9cb3cdbb41c218809690d39d70d79dff48f',
    '6cbf553053fcfe8b6c5e17313ef4383fcef4bc0cf3df48c904ed5e7b05af04a6',
    '7559c3628a54a498b715edbbb9a0f16fc65e94eaaf185b41e91f6bddf1a8e02e',
  ];
  let progressEventFiredAndWorking = false;
  let completeEventFired = false;
  const expectedProgressProps = ['percent', 'written', 'size'];
  const writer = penumbra.saveZip({
    /**
     * onProgress handler
     *
     * @param event - Event
     */
    onProgress(event) {
      progressEventFiredAndWorking = expectedProgressProps.every(
        (prop) => prop in event.detail,
      );
    },
    /** onComplete handler */
    onComplete() {
      completeEventFired = true;
    },
    allowDuplicates: true,
    saveBuffer: true,
  });
  writer.write(
    ...(await penumbra.get(
      {
        size: 874,
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        path: 'test/NYT.txt',
        mimetype: 'text/plain',
        decryptionOptions: {
          key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
          iv: '6lNU+2vxJw6SFgse',
          authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
        // for hash consistency
        lastModified: new Date(0),
      },
      {
        size: 874,
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        path: 'test/NYT.txt',
        mimetype: 'text/plain',
        decryptionOptions: {
          key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
          iv: '6lNU+2vxJw6SFgse',
          authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
        // for hash consistency
        lastModified: new Date(0),
      },
    )),
  );
  writer.write(
    ...(await penumbra.get(
      {
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        path: 'test/NYT.txt',
        mimetype: 'text/plain',
        decryptionOptions: {
          key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
          iv: '6lNU+2vxJw6SFgse',
          authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
        // for hash consistency
        lastModified: new Date(0),
      },
      {
        url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
        path: 'test/NYT.txt',
        mimetype: 'text/plain',
        decryptionOptions: {
          key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
          iv: '6lNU+2vxJw6SFgse',
          authTag: 'gadZhS1QozjEmfmHLblzbg==',
        },
        // for hash consistency
        lastModified: new Date(0),
      },
    )),
  );
  await writer.close();
  t.ok(
    progressEventFiredAndWorking,
    'zip progress event fired & emitted expected properties',
  );
  t.ok(completeEventFired, 'zip complete event fired');
  t.pass('zip saved');
  const zipBuffer = await writer.getBuffer();
  const zipHash = await hash('SHA-256', zipBuffer);
  logger.log('zip hash:', zipHash);
  t.ok(zipHash, 'zip hash');
  t.ok(
    expectedReferenceHashes.includes(zipHash.toLowerCase()),
    `expected zip hash (actual: ${zipHash})`,
  );

  const size = await writer.getSize();
  const expectedSize = 3496;
  t.equals(size, expectedSize, `expected zip size (actual: ${size})`);

  t.end();
});
/* eslint-enable max-lines */
