/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines */
const view = self;

const tests = [];
let failures = 0;

/**
 * Get the cryptographic hash of an ArrayBuffer
 *
 * @param ab - ArrayBuffer to digest
 * @param algorithm - Cryptographic hash digest algorithm
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

/** Penumbra has loaded */
const onReady = async (
  { detail: { penumbra } } = {
    detail: view,
  },
) => {
  tests.push(
    [
      'penumbra.get() and penumbra.getTextOrURI() test',
      async () => {
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
        const {
          type: test1Type,
          data: test1Text,
        } = await penumbra.getTextOrURI(await penumbra.get(NYT))[0];
        const test1Hash = await hash(
          'SHA-256',
          new TextEncoder().encode(test1Text),
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
            url:
              'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
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
            url:
              'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
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
        return isURL && imageHash === referenceHash;
      },
    ],
    [
      'penumbra.getTextOrURI(): including image in document',
      async () => {
        const { data: url } = await penumbra.getTextOrURI(
          await penumbra.get({
            url:
              'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
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
      'penumbra.getBlob()',
      async () => {
        const blob = await penumbra.getBlob(
          await penumbra.get({
            url:
              'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
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
      async () =>
        // TODO: write encrypt() tests
        false,
    ],
  );

  const getTestColor = (passed) => (passed ? 'limegreen' : 'crimson');

  // eslint-disable-next-line no-restricted-syntax
  for await (const [name, test] of tests) {
    const passed = await test();
    failures += !passed;
    console.log(
      `%c${
        passed ? '✅ PASS' : '❌ FAIL'
      } %c${name} (%creturned ${JSON.stringify(passed)}%c)`,
      `font-size:larger;color:${getTestColor(passed)}`,
      '',
      'color:gray',
      '',
    );
  }
  console.log(
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
