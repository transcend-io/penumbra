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
  // eslint-disable-next-line no-restricted-globals
  const timer = self.setTimeout(callback, delay * 1000);
  // eslint-disable-next-line no-restricted-globals
  const clear = self.clearTimeout.bind(self, timer);
  return { clear };
}

console.log('You should see 6 true assertions below if the tests are passing');

// eslint-disable-next-line no-restricted-globals
const view = self;

const tests = [];

/** Penumbra has loaded */
const onReady = async ({ detail: { penumbra } } = { detail: view }) => {
  tests.push(async () => {
    const cacheBuster = Math.random()
      .toString(10)
      .slice(2);
    await penumbra.setWorkerLocation({
      base: '/',
      decrypt: `decrypt.penumbra.worker.js?${cacheBuster}`,
      zip: `zip.penumbra.worker.js?${cacheBuster}`,
      StreamSaver: `streamsaver.penumbra.serviceworker.js?${cacheBuster}`,
    });
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
    const test1Text = await penumbra.getTextOrURI(await penumbra.get(NYT));
    console.log(test1Text.type === 'text', `test1Text.type === 'text'`);
    const test1Hash = await hash(
      'SHA-256',
      new TextEncoder().encode(test1Text.data),
    );
    const ref1Hash =
      '4933a43366fdda7371f02bb2a7e21b38f23db88a474b9abf9e33309cd15594d5';
    console.log(test1Hash === ref1Hash, `test1Hash === ref1Hash`);
  });
  tests.push(async () => {
    const progressEventName = 'penumbra-progress-emit-test';
    const fail = () => {
      console.log(false, 'progress event failed (took too long)');
    };
    const initTimeout = timeout(fail, 60);
    let stallTimeout;
    let initFinished = false;
    let progressStarted = false;
    let lastPercent;
    const onprogress = (event) => {
      const { percent } = event.detail;
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
          // eslint-disable-next-line no-restricted-globals
          view.removeEventListener(progressEventName, onprogress);
          console.log(true, 'get() progress event test');
        }
      }
      lastPercent = percent;
    };
  });
  tests.forEach(async (test) => test());
};

if (!view.penumbra) {
  view.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
