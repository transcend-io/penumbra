/* eslint-disable max-lines */
import { assert } from '@esm-bundle/chai';

import type { PenumbraFile, ProgressEmit, RemoteResource } from '../src/types';

import { penumbra } from '../src/index';
import { PenumbraSupportLevel } from '../src/enums';
import { logger } from '../src/logger';

import { hash, timeout } from './helpers';
import type { TimeoutManager } from './helpers/timeout';

import type { Fixture } from '../fixtures/types';
import {
  FIXTURES_SERVER_URL,
  REMOTE_FIXTURES_URL,
} from '../fixtures/constants';

import fixturesJson from '../fixtures/files/fixtures.json' with { type: 'json' };
import bufferEntireStream from './helpers/bufferEntireStream';

const fixtures = fixturesJson as Fixture[];

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
        : `${FIXTURES_SERVER_URL}/fixtures${remoteResource.url}`,
    },
    unencryptedChecksum,
  };
}

const view = self;

describe('Penumbra API', () => {
  it('should support at least size-limited', () => {
    assert.isAtLeast(
      penumbra.supported(),
      PenumbraSupportLevel.none,
      'penumbra.supported() is PenumbraSupportLevel.none',
    );
  });

  it.only('should get and decrypt a 1kb file', async () => {
    const { remoteResource, unencryptedChecksum } = getFixture(
      'file_example_JSON_1kb',
    );

    const [file] = await penumbra.get(remoteResource);
    const response = new Response(file.stream);
    const decryptedChecksum = await hash(
      'SHA-256',
      await response.arrayBuffer(),
    );

    assert.equal(decryptedChecksum, unencryptedChecksum);
  });

  it('should get and decrypt a 10MB file', async () => {
    const { remoteResource, unencryptedChecksum } = getFixture('zip_10MB');

    const [file] = await penumbra.get(remoteResource);
    const response = new Response(file.stream);
    const decryptedChecksum = await hash(
      'SHA-256',
      await response.arrayBuffer(),
    );

    assert.equal(decryptedChecksum, unencryptedChecksum);
  });

  it('should get and decrypt a 1kb file from S3', async () => {
    const { remoteResource, unencryptedChecksum } = getFixture(
      'file_example_JSON_1kb',
      true,
    );

    const [file] = await penumbra.get(remoteResource);
    const response = new Response(file.stream);
    const decryptedChecksum = await hash(
      'SHA-256',
      await response.arrayBuffer(),
    );

    assert.equal(decryptedChecksum, unencryptedChecksum);
  });

  it('should get text from a file', async () => {
    const { remoteResource, unencryptedChecksum } = getFixture('htmlfile');

    const [file] = await penumbra.get(remoteResource);
    const { type, data } = await penumbra.getTextOrURI([file])[0];
    const decryptedChecksum = await hash(
      'SHA-256',
      new TextEncoder().encode(data),
    );

    assert.equal(type, 'text');
    assert.equal(decryptedChecksum, unencryptedChecksum);
  });

  it('should get a media file as a URL', async () => {
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
    assert.isTrue(isURL, 'is url');
    assert.equal(mediaChecksum, unencryptedChecksum, 'checksum');
  });

  it('should fire progress events', async function testProgressEvents() {
    this.timeout(70000); // 60s for init, 10s for stall
    let lastPercent: number | null | undefined;

    const { result } = await new Promise<{
      /** The result of the test, if it passed */
      result?: boolean;
    }>((resolve) => {
      let res: boolean | undefined;
      const progressEventName = 'penumbra-progress';

      const fail = (): void => {
        res = false;
        view.removeEventListener(progressEventName, onprogress);
        resolve({ result: res });
      };

      const initTimeout = timeout(fail, 60);
      let stallTimeout: TimeoutManager;
      let initFinished = false;
      let progressStarted = false;

      const onprogress = (event: Event): void => {
        const {
          detail: { percent },
        } = event as ProgressEmit;

        if (percent === null) {
          lastPercent = percent;
          view.removeEventListener(progressEventName, onprogress);
          resolve({});
          return;
        }

        if (!Number.isNaN(percent)) {
          if (percent === 100) {
            if (initFinished) {
              stallTimeout.clear();
            } else {
              initTimeout.clear();
            }
            view.removeEventListener(progressEventName, onprogress);
            res = true;
            resolve({ result: res });
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
            res = true;
            resolve({ result: res });
          }
        }
        lastPercent = percent;
      };

      view.addEventListener(progressEventName, onprogress);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async () => {
        const { remoteResource } = getFixture('zip_10MB');
        const [{ stream }] = await penumbra.get(remoteResource);
        await new Response(stream).arrayBuffer();
      })();
    });

    if (lastPercent === null) {
      logger.warn(
        'Skipping test due to `null` percent: No content-length header was provided.',
      );
      this.skip();
    }

    assert.isTrue(result, 'progress event fired');
  });

  it('should get multiple resources', async () => {
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

    assert.equal(
      decryptedChecksum1,
      unencryptedChecksum1,
      `${remoteResource1.filePrefix} checksum`,
    );
    assert.equal(
      decryptedChecksum2,
      unencryptedChecksum2,
      `${remoteResource2.filePrefix} checksum`,
    );
  });

  it('should be able to include an image in the document', async function testImage() {
    this.timeout(6000); // 5s timeout + buffer
    const { remoteResource } = getFixture('file_example_JPG_500kB');

    const [file] = await penumbra.get(remoteResource);
    const { data: url } = await penumbra.getTextOrURI([file])[0];

    const testImage = new Image();
    const result = await new Promise((resolve) => {
      const timeoutManager = timeout(() => resolve(false), 5);
      const onLoad = (): void => {
        timeoutManager.clear();
        testImage.removeEventListener('load', onLoad);
        testImage.remove();
        resolve(true);
      };
      const onError = (): void => {
        timeoutManager.clear();
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

    assert.isTrue(result as boolean, 'Image loaded successfully');
  });

  it('should create preconnect links', () => {
    const { remoteResource } = getFixture('htmlfile', true);
    const measurePreconnects = (): number =>
      document.querySelectorAll('link[rel="preconnect"]').length;
    const start = measurePreconnects();
    const cleanup = penumbra.preconnect(remoteResource);
    const after = measurePreconnects();
    cleanup();
    assert.isAbove(after, start, 'preconnect link was added');
  });

  it('should create preload links', () => {
    const { remoteResource } = getFixture('htmlfile', true);
    const measurePreloads = (): number =>
      document.querySelectorAll(
        'link[rel="preload"][as="fetch"][crossorigin="use-credentials"]',
      ).length;
    const start = measurePreloads();
    const cleanup = penumbra.preload(remoteResource);
    const after = measurePreloads();
    cleanup();
    assert.isAbove(after, start, 'preload link was added');
  });

  it('should get a blob', async () => {
    const { remoteResource, unencryptedChecksum } = getFixture(
      'file_example_JPG_500kB',
    );
    const blob = await penumbra.getBlob(await penumbra.get(remoteResource));
    const imageBytes = await new Response(blob).arrayBuffer();
    const imageHash = await hash('SHA-256', imageBytes);

    assert.equal(imageHash, unencryptedChecksum, 'getBlob() checksum');
  });

  it('should encrypt large file', async () => {
    const NUM_BYTES = 2 ** 26; // 67 MB

    const te = new self.TextEncoder();
    const input = 't'.repeat(NUM_BYTES * 5);
    const buffer = te.encode(input);
    const { byteLength: size } = buffer;
    const stream0 = new Response(buffer).body!;
    const stream = stream0;

    const options = null;
    const file = { stream, size } as unknown as PenumbraFile;
    const t0 = performance.now();
    const encrypted = await penumbra.encrypt(options, file);
    const t1 = performance.now();
    logger.log(`encrypt() took ${t1 - t0}ms to return a stream`);
    await bufferEntireStream(encrypted.stream);
    const t2 = performance.now();
    logger.log(`bufferEntireStream() took ${t2 - t1}ms`);
  });

  it('should encrypt and decrypt', async () => {
    const te = new self.TextEncoder();
    const td = new self.TextDecoder();
    const input = 'test';
    const buffer = te.encode(input);
    const { byteLength: size } = buffer;
    const stream = new Response(buffer).body!;
    const options = null;
    const file = { stream, size } as unknown as PenumbraFile;
    const encrypted = await penumbra.encrypt(options, file);
    const decryptionInfo = await penumbra.getDecryptionInfo(encrypted);
    const decrypted = await penumbra.decrypt(decryptionInfo, encrypted);
    const decryptedData = await new Response(decrypted.stream).arrayBuffer();
    assert.equal(td.decode(decryptedData), input, 'encrypt() & decrypt()');
  });

  it('should save a zip', async () => {
    const { remoteResource: remoteResource1 } = getFixture(
      'file_example_JPG_500kB',
    );
    const { remoteResource: remoteResource2 } = getFixture('htmlfile');
    const { remoteResource: remoteResource3 } = getFixture(
      'file_example_CSV_5000',
    );
    const { remoteResource: remoteResource4 } = getFixture(
      'file_example_JSON_1kb',
    );

    let progressEventFiredAndWorking = false;
    let completeEventFired = false;
    const expectedProgressProps = ['percent', 'written', 'size'];
    const writer = penumbra.saveZip({
      /**
       * @param event - The progress event
       */
      onProgress(event) {
        progressEventFiredAndWorking = expectedProgressProps.every(
          (prop) => prop in event.detail,
        );
      },
      /**
       * When the zip is complete
       */
      onComplete() {
        completeEventFired = true;
      },
      allowDuplicates: true,
      saveBuffer: true,
    });

    await writer.write(
      ...(await penumbra.get(remoteResource1, remoteResource2)).map((file) => ({
        ...file,
        // Fixtures have a postfixed .enc extension, so we need to remove it
        path: file.path?.split('.enc')[0].replaceAll('/encrypted/', '/'),
      })),
    );
    await writer.write(
      ...(await penumbra.get(remoteResource3, remoteResource4)).map((file) => ({
        ...file,
        // Fixtures have a postfixed .enc extension, so we need to remove it
        path: file.path?.split('.enc')[0].replaceAll('/encrypted/', '/'),
      })),
    );
    await writer.close();
    assert.isTrue(
      progressEventFiredAndWorking,
      'zip progress event fired & emitted expected properties',
    );
    assert.isTrue(completeEventFired, 'zip complete event fired');

    // This is a rewrite version of the test below, but this implementation should have checksum tests on the expected zip
    // TODO: https://github.com/transcend-io/penumbra/issues/250
  });

  it('penumbra.save() should save a single file', async () => {
    const { remoteResource: remoteResource1 } = getFixture(
      'file_example_JPG_500kB',
    );

    const files = await penumbra.get(remoteResource1);
    await penumbra.save(files);
  });

  it('penumbra.save() should save a zip when multiple files are provided', async () => {
    const { remoteResource: remoteResource1 } = getFixture(
      'file_example_JPG_500kB',
    );
    const { remoteResource: remoteResource2 } = getFixture('htmlfile');
    const { remoteResource: remoteResource3 } = getFixture(
      'file_example_CSV_5000',
    );
    const { remoteResource: remoteResource4 } = getFixture(
      'file_example_JSON_1kb',
    );

    const files = await penumbra.get(
      remoteResource1,
      remoteResource2,
      remoteResource3,
      remoteResource4,
    );
    await penumbra.save(
      files.map((file) => ({
        ...file,
        path: file.path?.split('.enc')[0].replaceAll('/encrypted/', '/'),
      })),
    );
  });
});

describe('Error handling', () => {
  it('.get() should fail with an invalid authTag', async () => {
    const { remoteResource } = getFixture('file_example_JSON_1kb');
    remoteResource.decryptionOptions!.authTag = 'fo4LmWCZMNlvCsmp/nj6Cg=='; // invalid authTag
    try {
      const [file] = await penumbra.get(remoteResource);
      await bufferEntireStream(file.stream);
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.match(
        (error as Error).message,
        /Failed to finalize decryption stream/,
      );
    }
  });

  it('.get() should succeed when authTag is dangerously ignored', async () => {
    const { remoteResource, unencryptedChecksum } = getFixture(
      'file_example_JSON_1kb',
    );
    remoteResource.decryptionOptions!.authTag = 'fo4LmWCZMNlvCsmp/nj6Cg=='; // invalid authTag
    remoteResource.ignoreAuthTag = true;

    const [file] = await penumbra.get(remoteResource);
    const buffer = await bufferEntireStream(file.stream);
    const decryptedChecksum = await hash('SHA-256', buffer);

    assert.equal(decryptedChecksum, unencryptedChecksum);
  });
});

/* eslint-enable max-lines */
