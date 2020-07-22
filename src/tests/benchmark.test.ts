/* eslint-disable max-lines */
import test from 'tape';
import Bowser from 'bowser';
import {
  PenumbraAPI,
  PenumbraFile,
  PenumbraReady,
  PenumbraSupportLevel,
} from '../types';
import { hash, generateRandomUint8Array, parseSize } from './helpers';

// This browser name, e.g. 'Chrome', 'Safari', 'Firefox', ...
const browserName = Bowser.getParser(navigator.userAgent).getBrowserName();

const view = self;

let penumbra: PenumbraAPI;
test('setup', async (t) => {
  const onReady = async (event?: PenumbraReady) => {
    // eslint-disable-next-line no-shadow
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

test('penumbra.supported() test', async (t) => {
  t.assert(
    penumbra.supported() >= PenumbraSupportLevel.full,
    'penumbra.supported() is PenumbraSupportLevel.full',
  );
  t.end();
});

test('penumbra.encrypt() & penumbra.decrypt()', async (t) => {
  if (['Firefox', 'Safari'].includes(browserName)) {
    t.pass(
      `penumbra.encrypt() test bypassed for ${browserName}. TODO: Fix penumbra.encrypt() in ${browserName}!`,
    );
    t.end();
    return;
  }

  // TODO: use '2 GB'
  const targetSizeLabel = '16 KB';
  const targetSize = parseSize(targetSizeLabel);

  t.comment(
    `Generating ${targetSizeLabel} of data (${targetSize.toLocaleString()} bytes)`,
  );
  const genArrayStart = Date.now();
  const stream = generateRandomUint8Array(targetSize);
  const genArrayTime = (Date.now() - genArrayStart) / 1000;
  t.comment(
    `Time to generate ${targetSizeLabel} of data: ${genArrayTime} seconds`,
  );

  const hashStart = Date.now();
  const testHash = await hash('SHA-256', stream);
  const hashTime = (Date.now() - hashStart) / 1000;
  t.comment(`Time to hash data: ${hashTime} seconds`);

  const { byteLength: size } = stream;
  const options = null;
  const file = ({ stream, size } as unknown) as PenumbraFile;

  const encryptStart = Date.now();
  const [encrypted] = await penumbra.encrypt(options, file);
  const decryptionInfo = await penumbra.getDecryptionInfo(encrypted);
  const encryptTime = (Date.now() - encryptStart) / 1000;
  t.comment(`Time to encrypt data: ${encryptTime} seconds`);

  const decryptStart = Date.now();
  const [decrypted] = await penumbra.decrypt(decryptionInfo, encrypted);
  const decryptedData = await new Response(decrypted.stream).arrayBuffer();
  const decryptTime = (Date.now() - decryptStart) / 1000;
  t.comment(`Time to decrypt data: ${decryptTime} seconds`);

  t.equal(await hash('SHA-256', decryptedData), testHash);
  t.end();
});
