/* eslint-disable max-lines */
import test from 'tape';
import {
  PenumbraAPI,
  PenumbraFile,
  PenumbraReady,
  ProgressEmit,
  type RemoteResource,
} from '../src/types';
import { PenumbraSupportLevel } from '../src/enums';

import { hash, timeout } from './helpers';
import { TimeoutManager } from './helpers/timeout';
import { logger } from '../src/logger';
import fixtures from '../fixtures/files/fixtures.json';
import type { Fixture } from '../fixtures/rebuild-fixtures';
import { KARMA_FIXTURES_URL, REMOTE_FIXTURES_URL } from '../fixtures/constants';

/** Extend global Window */
declare global {
  /** Extend self */
  interface Window {
    /** self.penumbra interface */
    penumbra?: PenumbraAPI;
  }
}

/**
 * Get a fixture by file prefix
 * @param filePrefix - The file prefix (filename without extension) of the fixture to get
 * @param remote - Whether to use the fixture on S3, rather than the local server (default: false)
 * @returns A remote resource and a checksum of the unencrypted file
 */
function getFixture(
  filePrefix: string,
  remote = false,
): {
  /** The remote resource */
  remoteResource: RemoteResource;
  /** A checksum of the unencrypted file */
  unencryptedChecksum: string;
} {
  const fixture = (fixtures as Fixture[]).find(
    (f) => f.filePrefix === filePrefix,
  );
  if (!fixture) {
    throw new Error(`Fixture ${filePrefix} not found`);
  }
  const { unencryptedChecksum, ...remoteResource } = fixture;
  return {
    remoteResource: {
      ...remoteResource,
      url: remote
        ? `${REMOTE_FIXTURES_URL}${remoteResource.url}`
        : `${KARMA_FIXTURES_URL}${remoteResource.url}`,
    },
    unencryptedChecksum,
  };
}

const view = self;

let penumbra: PenumbraAPI;

test('setup', (t) => {
  const onReady = (event?: Event): void => {
    const penumbraReady = event as PenumbraReady | undefined;
    logger.log('penumbra ready fired!');
    penumbra = ((penumbraReady && penumbraReady.detail.penumbra) ||
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

test('penumbra.supported() test', (t) => {
  t.assert(
    penumbra.supported() >= PenumbraSupportLevel.size_limited,
    'penumbra.supported() is PenumbraSupportLevel.size_limited or PenumbraSupportLevel.full',
  );
  t.end();
});

test('penumbra.get() test - 1kb', async (t) => {
  const { remoteResource, unencryptedChecksum } = getFixture(
    'file_example_JSON_1kb',
  );

  const [file] = await penumbra.get(remoteResource);
  const response = new Response(file.stream);
  const decryptedChecksum = await hash('SHA-256', await response.arrayBuffer());

  t.equal(decryptedChecksum, unencryptedChecksum);
  t.end();
});

test('penumbra.get() test - 10MB', async (t) => {
  const { remoteResource, unencryptedChecksum } = getFixture('zip_10MB');

  const [file] = await penumbra.get(remoteResource);
  const response = new Response(file.stream);
  const decryptedChecksum = await hash('SHA-256', await response.arrayBuffer());

  t.equal(decryptedChecksum, unencryptedChecksum);
  t.end();
});

test('penumbra.get() test - 1kb from S3', async (t) => {
  const { remoteResource, unencryptedChecksum } = getFixture(
    'file_example_JSON_1kb',
    true,
  );

  const [file] = await penumbra.get(remoteResource);
  const response = new Response(file.stream);
  const decryptedChecksum = await hash('SHA-256', await response.arrayBuffer());

  t.equal(decryptedChecksum, unencryptedChecksum);
  t.end();
});

test('penumbra.getTextOrURI(): text', async (t) => {
  const { remoteResource, unencryptedChecksum } = getFixture('htmlfile');

  const [file] = await penumbra.get(remoteResource);
  const { type, data } = await penumbra.getTextOrURI([file])[0];
  const decryptedChecksum = await hash(
    'SHA-256',
    new TextEncoder().encode(data),
  );

  t.equal(type, 'text');
  t.equal(decryptedChecksum, unencryptedChecksum);
  t.end();
});

test('penumbra.getTextOrURI(): media (as URL)', async (t) => {
  const { remoteResource, unencryptedChecksum } = getFixture(
    'file_example_MOV_480_700kB',
  );

  const [file] = await penumbra.get(remoteResource);
  const { type, data: blobUrl } = await penumbra.getTextOrURI([file])[0];

  const mediaBytes = await fetch(blobUrl).then((r) => r.arrayBuffer());
  const mediaChecksum = await hash('SHA-256', mediaBytes);

  let isURL;
  try {
    new URL(blobUrl, location.href); // eslint-disable-line no-new
    isURL = type === 'uri';
  } catch (ex) {
    isURL = false;
  }
  t.true(isURL, 'is url');
  t.equal(mediaChecksum, unencryptedChecksum, 'checksum');
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
  let lastPercent: number | null | undefined;
  const onprogress: EventListener = (event: Event): void => {
    const {
      detail: { percent },
    } = event as ProgressEmit;
    if (percent === null) {
      lastPercent = percent;
      view.removeEventListener(progressEventName, onprogress);
      return;
    }
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
        if (percent > (lastPercent ?? 0)) {
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

  const { remoteResource } = getFixture('zip_10MB');
  const [{ stream }] = await penumbra.get(remoteResource);
  await new Response(stream).arrayBuffer();

  if (lastPercent === null) {
    t.skip(
      'Skipping test due to `null` percent: No content-length header was provided.',
    );
    return;
  }

  t.ok(result, 'progress event fired');
  t.end();
});

test('penumbra.get() with multiple resources', async (t) => {
  const {
    remoteResource: remoteResource1,
    unencryptedChecksum: unencryptedChecksum1,
  } = getFixture('htmlfile');
  const {
    remoteResource: remoteResource2,
    unencryptedChecksum: unencryptedChecksum2,
  } = getFixture('file_example_MOV_480_700kB');

  const files = await penumbra.get(remoteResource1, remoteResource2);
  const [decryptedChecksum1, decryptedChecksum2] = await Promise.all(
    files.map(async (file) => {
      const response = new Response(file.stream);
      const arrayBuffer = await response.arrayBuffer();
      return hash('SHA-256', arrayBuffer);
    }),
  );

  t.equal(
    decryptedChecksum1,
    unencryptedChecksum1,
    `${remoteResource1.filePrefix} checksum`,
  );
  t.equal(
    decryptedChecksum2,
    unencryptedChecksum2,
    `${remoteResource2.filePrefix} checksum`,
  );
  t.end();
});

test('penumbra.getTextOrURI(): including image in document', async (t) => {
  const { remoteResource } = getFixture('file_example_JPG_500kB');

  const [file] = await penumbra.get(remoteResource);
  const { data: url } = await penumbra.getTextOrURI([file])[0];

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
    testImage.style.visibility = 'hidden';
    document.body.appendChild(testImage);
  });

  t.ok(result);
  t.end();
});

test('penumbra.preconnect()', (t) => {
  const { remoteResource } = getFixture('htmlfile', true);
  const measurePreconnects = (): number =>
    document.querySelectorAll('link[rel="preconnect"]').length;
  const start = measurePreconnects();
  const cleanup = penumbra.preconnect(remoteResource);
  const after = measurePreconnects();
  cleanup();
  t.assert(start < after, 'preconnects');
  t.end();
});

test('penumbra.preload()', (t): void => {
  const { remoteResource } = getFixture('htmlfile', true);
  const measurePreloads = (): number =>
    document.querySelectorAll(
      'link[rel="preload"][as="fetch"][crossorigin="use-credentials"]',
    ).length;
  const start = measurePreloads();
  const cleanup = penumbra.preload(remoteResource);
  const after = measurePreloads();
  cleanup();
  t.assert(start < after, 'preloads');
  t.end();
});

test('penumbra.getBlob()', async (t) => {
  const { remoteResource, unencryptedChecksum } = getFixture(
    'file_example_JPG_500kB',
  );
  const blob = await penumbra.getBlob(await penumbra.get(remoteResource));
  const imageBytes = await new Response(blob).arrayBuffer();
  const imageHash = await hash('SHA-256', imageBytes);

  t.equal(imageHash, unencryptedChecksum, 'getBlob() checksum');
  t.end();
});

test('penumbra.encrypt() & penumbra.decrypt()', async (t) => {
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
  t.equal(td.decode(decryptedData), input, 'encrypt() & decrypt()');
  t.end();
});

// TODO: https://github.com/transcend-io/penumbra/issues/250
test.skip('penumbra.saveZip({ saveBuffer: true }) - getBuffer(), getSize() and auto-renaming', async (t) => {
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
