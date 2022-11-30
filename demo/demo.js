/* eslint-disable max-lines */
const view = self;

const tests = [];
let failures = 0;
const logger = console;

/**
 * Get the cryptographic hash of an ArrayBuffer
 *
 * @param algorithm - Cryptographic hash digest algorithm
 * @param ab - ArrayBuffer to digest
 * @returns Hexadecimal hash digest string
 */
async function hash(algorithm, ab) {
  const digest = new Uint8Array(
    await crypto.subtle.digest(algorithm, await ab),
  );
  return digest.reduce((memo, i) => memo + i.toString(16).padStart(2, '0'), '');
}

/**
 * Set and manage a timeout
 *
 * @param callback - Timeout callback
 * @param delay - Time in seconds to wait before calling the callback
 * @returns Timeout cancellation helper
 */
function timeout(callback, delay) {
  const timer = view.setTimeout(callback, delay * 1000);
  const clear = view.clearTimeout.bind(view, timer);
  return {
    clear,
  };
}

/**
 * Penumbra has loaded
 *
 * @param options - Options
 */
const onReady = async (
  { detail: { penumbra } } = {
    detail: view,
  },
) => {
  tests.push(
    [
      'penumbra.get() and penumbra.getTextOrURI() test (no credentials)',
      async () => {
        if (!self.TextEncoder) {
          logger.warn(
            'skipping test due to lack of browser support for TextEncoder',
          );
          return false;
        }
        // const cacheBuster = Math.random().toString(10).slice(2);
        // await penumbra.setWorkerLocation(`worker.penumbra.js?${cacheBuster}`);
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
        const { type: test1Type, data: test1Text } =
          await penumbra.getTextOrURI(await penumbra.get(NYT))[0];
        const test1Hash = await hash(
          'SHA-256',
          new self.TextEncoder().encode(test1Text),
        );
        const ref1Hash =
          '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5';
        return test1Type === 'text' && test1Hash === ref1Hash;
      },
    ],
    [
      'progress event test',
      async () => {
        let result;
        const progressEventName = 'penumbra-progress';
        const fail = () => {
          result = false;
        };
        const initTimeout = timeout(fail, 60);
        let stallTimeout;
        let initFinished = false;
        let progressStarted = false;
        let lastPercent;
        const onprogress = ({ detail: { percent } }) => {
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
        return result;
      },
    ],
    [
      'penumbra.get() with multiple resources',
      async () => {
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
        return hashes[0] === referenceHash1 && hashes[1] === referenceHash2;
      },
    ],
    [
      'penumbra.get() images (as ReadableStream)',
      async () => {
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
        return imageHash === referenceHash;
      },
    ],
    [
      'penumbra.getTextOrURI(): images (as URL)',
      async () => {
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
        return isURL && imageHash === referenceHash;
      },
    ],
    [
      'penumbra.getTextOrURI(): including image in document',
      async () => {
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
        return new Promise((resolve) => {
          // 5-second timeout for the image to load
          timeout(resolve.bind(this, false), 5);
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
      },
    ],
    [
      'penumbra.preconnect()',
      () => {
        const measurePreconnects = () =>
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
        return start < after;
      },
    ],
    [
      'penumbra.preload()',
      () => {
        const measurePreloads = () =>
          document.querySelectorAll('link[rel="preload"]').length;
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
        return start < after;
      },
    ],
    [
      'penumbra.getBlob()',
      async () => {
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
        return imageHash === referenceHash;
      },
    ],
    [
      'penumbra.encrypt()',
      async () => {
        if (!self.TextEncoder || !self.TextDecoder) {
          logger.warn(
            'skipping test due to lack of browser support for TextEncoder/TextDecoder',
          );
          return false;
        }
        const te = new self.TextEncoder();
        const td = new self.TextDecoder();
        const input = 'test';
        const buffer = te.encode(input);
        const { byteLength: size } = buffer;
        const stream = new Response(buffer).body;
        const options = null;
        const file = {
          stream,
          size,
        };
        const [encrypted] = await penumbra.encrypt(options, file);
        const decryptionInfo = await penumbra.getDecryptionInfo(encrypted);
        const [decrypted] = await penumbra.decrypt(decryptionInfo, encrypted);
        const decryptedData = await new Response(
          decrypted.stream,
        ).arrayBuffer();
        const decryptedText = td.decode(decryptedData);
        logger.log('decrypted text:', decryptedText);
        return decryptedText === input;
      },
    ],
    [
      'penumbra.saveZip({ saveBuffer: true }) (getBuffer(), getSize() and auto-renaming)',
      () =>
        // eslint-disable-next-line no-async-promise-executor
        new Promise(async (resolve) => {
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
          logger.log(
            progressEventFiredAndWorking,
            'zip progress event fired & emitted expected properties',
          );
          logger.log(completeEventFired, 'zip complete event fired');
          const zipBuffer = await writer.getBuffer();
          const zipHash = await hash('SHA-256', zipBuffer);
          logger.log('zip hash:', zipHash);
          const size = await writer.getSize();
          const expectedSize = 3496;
          logger.log(
            size === expectedSize,
            `expected zip size (actual: ${size})`,
          );
          resolve(
            expectedReferenceHashes.includes(zipHash.toLowerCase()) &&
              size === expectedSize,
          );
        }),
    ],
    [
      'penumbra.saveZip() (completion & size tracking only)',
      async () => {
        const files = [
          {
            url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
            path: 'test/tortoise.jpg',
            mimetype: 'image/jpeg',
            decryptionOptions: {
              key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
              iv: '6lNU+2vxJw6SFgse',
              authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
            },
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
          },
        ];
        const writer = penumbra.saveZip();
        await writer.write(...(await penumbra.get(...files)));

        const closeSize = await writer.close();
        const size = await writer.getSize();
        const expectedSize = 270826;
        logger.log(
          size === closeSize,
          'writer.close() size matches writer.getSize()',
        );
        logger.log(
          size === expectedSize,
          `expected zip size (actual: ${size})`,
        );

        return size === expectedSize;
      },
    ],
  );

  const getTestColor = (passed) => (passed ? 'limegreen' : 'crimson');

  // eslint-disable-next-line no-restricted-syntax
  for await (const [name, test] of tests) {
    const passed = await test();
    failures += !passed;
    logger.log(
      `%c${
        passed ? '✅ PASS' : '❌ FAIL'
      } %c${name} (%creturned ${JSON.stringify(passed)}%c)`,
      `font-size:larger;color:${getTestColor(passed)}`,
      '',
      'color:gray',
      '',
    );
  }
  logger.log(
    `%c${
      failures
        ? `❌ ${failures} test${failures > 1 ? 's' : ''} failed`
        : '✅ All tests passed!'
    }`,
    `font-size:x-large;color:${getTestColor(!failures)}`,
  );
};

if (!view.penumbra) {
  view.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
/* eslint-enable max-lines */
