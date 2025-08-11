import { assert } from '@esm-bundle/chai';

import type {
  PenumbraFile,
  ProgressEmit,
  RemoteResource,
  ZipProgressEmit,
} from '../src/types';

import { penumbra } from '../src/index';
import { PenumbraSupportLevel } from '../src/enums';
import { LogLevel } from '../src/logger';

import { hash, timeout } from './helpers';
import type { TimeoutManager } from './helpers/timeout';

import type { Fixture } from '../fixtures/types';
import {
  FIXTURES_SERVER_URL,
  REMOTE_FIXTURES_URL,
} from '../fixtures/constants';

import fixturesJson from '../fixtures/files/fixtures.json' with { type: 'json' };
import bufferEntireStream from './helpers/buffer-entire-stream';

// Penumbra config
penumbra.setLogLevel(LogLevel.DEBUG);

// For logging in tests, don't use the logger from src/logger.ts which is intended for Penumbra's internal logging
const logger = console;

// Fixtures
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
  remoteResource: Omit<Fixture, 'unencryptedChecksum'> & RemoteResource;
  /** A checksum of the unencrypted file */
  unencryptedChecksum: string;
} {
  const fixture = fixtures.find((f) => f.filePrefix === filePrefix);
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

const measurePreconnects = (): number =>
  document.querySelectorAll('link[rel="preconnect"]').length;
const measurePreloads = (): number =>
  document.querySelectorAll(
    'link[rel="preload"][as="fetch"][crossorigin="use-credentials"]',
  ).length;

const view = self;

describe('Penumbra API', () => {
  it('should support at least size-limited', () => {
    assert.isAtLeast(
      penumbra.supported(),
      PenumbraSupportLevel.none,
      'penumbra.supported() is PenumbraSupportLevel.none',
    );
  });

  it('should get and decrypt a 1kb file', async () => {
    const { remoteResource, unencryptedChecksum } = getFixture(
      'file_example_JSON_1kb',
    );

    const [file] = await penumbra.get(remoteResource);
    if (!file) {
      throw new Error('No file returned from penumbra.get()');
    }
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
    if (!file) {
      throw new Error('No file returned from penumbra.get()');
    }
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
    if (!file) {
      throw new Error('No file returned from penumbra.get()');
    }
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
    if (!file) {
      throw new Error('No file returned from penumbra.get()');
    }
    const response = await penumbra.getTextOrURI([file])[0];
    if (!response) {
      throw new Error('No response returned from penumbra.getTextOrURI()');
    }
    const { type, data } = response;
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
    if (!file) {
      throw new Error('No file returned from penumbra.get()');
    }
    const response = await penumbra.getTextOrURI([file])[0];
    if (!response) {
      throw new Error('No response returned from penumbra.getTextOrURI()');
    }
    const { type, data: blobUrl } = response;

    const mediaBytes = await fetch(blobUrl).then((r) => r.arrayBuffer());
    const mediaChecksum = await hash('SHA-256', mediaBytes);

    let isURL;
    try {
      new URL(blobUrl, location.href);
      isURL = type === 'uri';
    } catch {
      isURL = false;
    }
    assert.isTrue(isURL, 'is url');
    assert.equal(mediaChecksum, unencryptedChecksum, 'checksum');
  });

  it('should fire progress events', async function testProgressEvents() {
    this.timeout(70_000); // 60s for init, 10s for stall
    let lastPercent: number | null | undefined;

    const { result } = await new Promise<{
      /** The result of the test, if it passed */
      result?: boolean;
    }>((resolve) => {
      let listenerResult: boolean | undefined;
      const progressEventName = 'penumbra-progress';

      const fail = (): void => {
        listenerResult = false;
        view.removeEventListener(progressEventName, onprogress);
        resolve({ result: listenerResult });
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
            listenerResult = true;
            resolve({ result: listenerResult });
            return;
          }

          if (!initFinished) {
            initTimeout.clear();
            stallTimeout = timeout(fail, 10);
            initFinished = true;
            lastPercent = percent;
          } else if (!progressStarted && percent > (lastPercent ?? 0)) {
            stallTimeout.clear();
            progressStarted = true;
          }

          if (progressStarted && percent > 25) {
            view.removeEventListener(progressEventName, onprogress);
            listenerResult = true;
            resolve({ result: listenerResult });
          }
        }
        lastPercent = percent;
      };

      view.addEventListener(progressEventName, onprogress);

      (async () => {
        const { remoteResource } = getFixture('zip_10MB');
        const [file] = await penumbra.get(remoteResource);
        if (!file) {
          throw new Error('No file returned from penumbra.get()');
        }
        const { stream } = file;
        await new Response(stream).arrayBuffer();
      })().catch((error: unknown) => {
        logger.error('Error running should fire progress events test', error);
      });
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
    if (!file) {
      throw new Error('No file returned from penumbra.get()');
    }
    const response = await penumbra.getTextOrURI([file])[0];
    if (!response) {
      throw new Error('No response returned from penumbra.getTextOrURI()');
    }
    const { data: url } = response;

    const testImage = new Image();
    const result = await new Promise((resolve) => {
      const timeoutManager = timeout(() => {
        resolve(false);
      }, 5);
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
      document.body.append(testImage);
    });

    assert.isTrue(result as boolean, 'Image loaded successfully');
  });

  it('should create preconnect links', () => {
    const { remoteResource } = getFixture('htmlfile', true);

    const start = measurePreconnects();
    const cleanup = penumbra.preconnect(remoteResource);
    const after = measurePreconnects();
    cleanup();
    assert.isAbove(after, start, 'preconnect link was added');
  });

  it('should create preload links', () => {
    const { remoteResource } = getFixture('htmlfile', true);

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

  // skipping to speed up CI, but good to test locally (firefox will need timeout to be ~2 min)
  it.skip('should encrypt large file', async () => {
    const NUM_BYTES = 2 ** 26; // 67 MB

    const te = new self.TextEncoder();
    const input = 't'.repeat(NUM_BYTES * 5);
    const buffer = te.encode(input);
    const { byteLength: size } = buffer;
    const stream = new Response(buffer).body;

    const options = null;
    const file = { stream, size } as unknown as PenumbraFile;
    const t0 = performance.now();
    const encrypted = await penumbra.encrypt(options, file);
    const t1 = performance.now();
    logger.debug(
      `encrypt() took ${(t1 - t0).toLocaleString()}ms to return a stream`,
    );
    await bufferEntireStream(encrypted.stream);
    const t2 = performance.now();
    logger.debug(
      `bufferEntireStream() took ${(t2 - t1).toLocaleString()}ms to buffer`,
    );
  });

  it('should encrypt and decrypt', async () => {
    const te = new self.TextEncoder();
    const td = new self.TextDecoder();
    const input = 'test'.repeat(2 ** 20);
    const buffer = te.encode(input);
    const { byteLength: size } = buffer;
    const stream = new Response(buffer).body;
    const options = null;
    const file = { stream, size } as unknown as PenumbraFile;
    const encrypted = await penumbra.encrypt(options, file);

    // Must finish streaming before calling getDecryptionInfo()
    const encryptedBuffer = await bufferEntireStream(encrypted.stream);

    const decryptionInfo = await penumbra.getDecryptionInfo(encrypted);
    const decrypted = await penumbra.decrypt(decryptionInfo, {
      ...encrypted,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      stream: new Response(encryptedBuffer).body!,
    });
    const decryptedData = await bufferEntireStream(decrypted.stream);
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
    const expectedProgressProperties = ['percent', 'written', 'size'];
    const writer = penumbra.saveZip({
      streamSaverEndpoint: 'https://streaming.transcend.io/endpoint.html',
      /**
       * @param event - The progress event
       */
      onProgress(event: ZipProgressEmit) {
        progressEventFiredAndWorking = expectedProgressProperties.every(
          (property) => property in event.detail,
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

    const firstTwo = await penumbra.get(remoteResource1, remoteResource2);
    await writer.write(
      ...firstTwo.map((file) => ({
        ...file,
        // Fixtures have a postfixed .enc extension, so we need to remove it
        path: file.path?.split('.enc')[0]?.replaceAll('/encrypted/', '/'),
      })),
    );
    const lastTwo = await penumbra.get(remoteResource3, remoteResource4);
    await writer.write(
      ...lastTwo.map((file) => ({
        ...file,
        // Fixtures have a postfixed .enc extension, so we need to remove it
        path: file.path?.split('.enc')[0]?.replaceAll('/encrypted/', '/'),
      })),
    );
    await writer.close();
    assert.isTrue(
      progressEventFiredAndWorking,
      'zip progress event fired & emitted expected properties',
    );
    assert.isTrue(completeEventFired, 'zip complete event fired');
  });

  it('penumbra.save() should save a single file', async () => {
    const { remoteResource: remoteResource1 } = getFixture(
      'file_example_JPG_500kB',
    );

    const files = await penumbra.get(remoteResource1);
    await penumbra.save(files, 'https://streaming.transcend.io/endpoint.html');
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
        path: file.path?.split('.enc')[0]?.replaceAll('/encrypted/', '/'),
      })),
      'https://streaming.transcend.io/endpoint.html',
    );
  });

  it('should set the log level', () => {
    penumbra.setLogLevel(LogLevel.DEBUG);
  });
});

describe('Error handling', () => {
  it('.get() should fail with an invalid authTag', async () => {
    const { remoteResource } = getFixture('file_example_JSON_1kb');
    remoteResource.decryptionOptions.authTag = 'fo4LmWCZMNlvCsmp/nj6Cg=='; // invalid authTag
    try {
      const [file] = await penumbra.get(remoteResource);
      if (!file) {
        throw new Error('No file returned from penumbra.get()');
      }
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
    remoteResource.decryptionOptions.authTag = 'fo4LmWCZMNlvCsmp/nj6Cg=='; // invalid authTag
    remoteResource.ignoreAuthTag = true;

    const [file] = await penumbra.get(remoteResource);
    if (!file) {
      throw new Error('No file returned from penumbra.get()');
    }
    const buffer = await bufferEntireStream(file.stream);
    const decryptedChecksum = await hash('SHA-256', buffer);

    assert.equal(decryptedChecksum, unencryptedChecksum);
  });
});
