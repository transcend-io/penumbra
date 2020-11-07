<p align="center">
  <img alt="Penumbra by Transcend" src="https://user-images.githubusercontent.com/7354176/61583246-43519500-aaea-11e9-82a2-e7470f3d4e00.png"/>
</p>
<h1 align="center">Penumbra</h1>
<p align="center">
  <strong>Encrypt/decrypt anything in the browser using streams on background threads.</strong>
  <br /><br />
  <i>Quickly and efficiently decrypt remote resources in the browser. Display the files in the DOM, or download them with <a href="https://github.com/transcend-io/conflux">conflux</a>.</i>
  <br /><br />
  <a href="https://travis-ci.com/transcend-io/penumbra"><img src="https://travis-ci.com/transcend-io/penumbra.svg?branch=master" alt="Build Status"></a>
  <a href="https://automate.browserstack.com/public-build/SmJHL1l4Q1hTZkFZMlBCWnBDcElEZndaWFgxbklqdTd5UkxDMFBISUdEST0tLUU2SFdLazhFd1BWU2NjSU1NcWdpS3c9PQ==--1c3006209d588dbf401864442d5b60b191f05025%"><img src='https://automate.browserstack.com/badge.svg?badge_key=SmJHL1l4Q1hTZkFZMlBCWnBDcElEZndaWFgxbklqdTd5UkxDMFBISUdEST0tLUU2SFdLazhFd1BWU2NjSU1NcWdpS3c9PQ==--1c3006209d588dbf401864442d5b60b191f05025%'/></a>
  <a href="https://snyk.io//test/github/transcend-io/penumbra?targetFile=package.json"><img src="https://snyk.io//test/github/transcend-io/penumbra/badge.svg?targetFile=package.json" alt="Known Vulnerabilities"></a>
  <a href="https://app.fossa.io/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra?ref=badge_shield" alt="FOSSA Status"><img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra.svg?type=shield"/></a>
  <a href="https://app.netlify.com/sites/penumbra-demo/deploys"><img src="https://api.netlify.com/api/v1/badges/533125dc-c7af-4442-af32-df7283c7322b/deploy-status" alt="Netlify Status"></a>
</p>
<br />

<!-- toc -->

- [Compatibility](#compatibility)
- [Usage](#usage)
  - [Importing Penumbra](#importing-penumbra)
    - [With Yarn/NPM](#with-yarnnpm)
    - [Vanilla JS](#vanilla-js)
  - [.get](#get)
  - [.encrypt](#encrypt)
  - [.getDecryptionInfo](#getdecryptioninfo)
  - [.decrypt](#decrypt)
  - [.save](#save)
  - [.getBlob](#getblob)
  - [.getTextOrURI](#gettextoruri)
  - [.saveZip](#savezip)
  - [.setWorkerLocation](#setworkerlocation)
- [Examples](#examples)
  - [Display encrypted text](#display-encrypted-text)
  - [Display encrypted image](#display-encrypted-image)
  - [Download an encrypted file](#download-an-encrypted-file)
  - [Download many encrypted files](#download-many-encrypted-files)
- [Advanced](#advanced)
  - [Prepare connections for file downloads in advance](#prepare-connections-for-file-downloads-in-advance)
  - [Encrypt/Decrypt Job Completion Event Emitter](#encryptdecrypt-job-completion-event-emitter)
  - [Progress Event Emitter](#progress-event-emitter)
  - [Configure worker location](#configure-worker-location)
  - [Waiting for the `penumbra-ready` event](#waiting-for-the-penumbra-ready-event)
  - [Querying Penumbra browser support](#querying-penumbra-browser-support)
- [Contributing](#contributing)
- [License](#license)

<!-- tocstop -->

## Compatibility

|          | .decrypt | .encrypt | .saveZip |
| -------- | -------: | -------: | -------: |
| Chrome   |       ✅ |       ✅ |       ✅ |
| Edge >18 |       ✅ |       ✅ |       ✅ |
| Safari   |       🐢 |       🐢 |       🟡 |
| Firefox  |       🐢 |       🐢 |       🟡 |
| Edge 18  |       ❌ |       ❌ |       ❌ |

✅ = Full support with workers

🐢 = Uses main thread (lacks native WritableStream support)

🟡 = 32 MiB limit

❌ = No support

## Usage

### Importing Penumbra

#### With Yarn/NPM

```sh
yarn add @transcend-io/penumbra

# or
npm install --save @transcend-io/penumbra
```

```js
import { penumbra } from '@transcend-io/penumbra';

penumbra.get(...files).then(penumbra.save);
```

#### Vanilla JS

```html
<script src="lib/main.penumbra.js"></script>
<script>
  penumbra
    .get(...files)
    .then(penumbra.getTextOrURI)
    .then(displayInDOM);
</script>
```

_Check out [this guide](#waiting-for-the-penumbra-ready-event) for asynchronous loading._

### .get

Fetch and decrypt remote files.

```ts
penumbra.get(...resources: RemoteResource[]): Promise<PenumbraFile[]>
```

### .encrypt

Encrypt files.

```ts
penumbra.encrypt(options: PenumbraEncryptionOptions, ...files: PenumbraFile[]): Promise<PenumbraEncryptedFile[]>
```

```ts
size = 4096 * 128;
addEventListener('penumbra-progress', (e) => console.log(e.type, e.detail));
addEventListener('penumbra-complete', (e) => console.log(e.type, e.detail));
file = penumbra.encrypt(null, {
  stream: new Response(new Uint8Array(size)).body,
  size,
});
data = [];
file.then(async ([encrypted]) => {
  console.log('encryption complete');
  data.push(new Uint8Array(await new Response(encrypted.stream).arrayBuffer()));
});
```

### .getDecryptionInfo

Get decryption info for a file, including the iv, authTag, and key. This may only be called on files that have finished being encrypted.

```ts
penumbra.getDecryptionInfo(file: PenumbraFile): Promise<PenumbraDecryptionInfo>
```

### .decrypt

Decrypt files.

```ts
penumbra.decrypt(options: PenumbraDecryptionInfo, ...files: PenumbraEncryptedFile[]): Promise<PenumbraFile[]>
```

```ts
const te = new TextEncoder();
const td = new TextDecoder();
const data = te.encode('test');
const { byteLength: size } = data;
const [encrypted] = await penumbra.encrypt(null, {
  stream: data,
  size,
});
const options = await penumbra.getDecryptionInfo(encrypted);
const [decrypted] = await penumbra.decrypt(options, encrypted);
const decryptedData = await new Response(decrypted.stream).arrayBuffer();
return td.decode(decryptedData) === 'test';
```

### .save

Save files retrieved by Penumbra. Downloads a .zip if there are multiple files. Returns an AbortController that can be used to cancel an in-progress save stream.

```ts
penumbra.save(data: PenumbraFile[], fileName?: string): AbortController
```

### .getBlob

Load files retrieved by Penumbra into memory as a Blob.

```ts
penumbra.getBlob(data: PenumbraFile[] | PenumbraFile | ReadableStream, type?: string): Promise<Blob>
```

### .getTextOrURI

Get file text (if content is text) or [URI](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) (if content is not viewable).

```ts
penumbra.getTextOrURI(data: PenumbraFile[]): Promise<{ type: 'text'|'uri', data: string, mimetype: string }[]>
```

### .saveZip

Save a zip containing files retrieved by Penumbra.

```ts
type ZipOptions = {
  /** Filename to save to (.zip is optional) */
  name?: string;
  /** Total size of archive in bytes (if known ahead of time, for 'store' compression level) */
  size?: number;
  /** PenumbraFile[] to add to zip archive */
  files?: PenumbraFile[];
  /** Abort controller for cancelling zip generation and saving */
  controller?: AbortController;
  /** Allow & auto-rename duplicate files sent to writer. Defaults to on */
  allowDuplicates: boolean;
  /** Zip archive compression level */
  compressionLevel?: number;
  /** Store a copy of the resultant zip file in-memory for inspection & testing */
  saveBuffer?: boolean;
  /**
   * Auto-registered `'progress'` event listener. This is equivalent to calling
   * `PenumbraZipWriter.addEventListener('progress', onProgress)`
   */
  onProgress?(event: CustomEvent<ZipProgressDetails>): void;
  /**
   * Auto-registered `'complete'` event listener. This is equivalent to calling
   * `PenumbraZipWriter.addEventListener('complete', onComplete)`
   */
  onComplete?(event: CustomEvent<{}>): void;
};

penumbra.saveZip(options?: ZipOptions): PenumbraZipWriter;

interface PenumbraZipWriter extends EventTarget {
  /**
   * Add decrypted PenumbraFiles to zip
   *
   * @param files - Decrypted PenumbraFile[] to add to zip
   * @returns Total observed size of write call in bytes
   */
  write(...files: PenumbraFile[]): Promise<number>;
  /**
   * Enqueue closing of the Penumbra zip writer (after pending writes finish)
   *
   * @returns Total observed zip size in bytes after close completes
   */
  close(): Promise<number>;
  /** Cancel Penumbra zip writer */
  abort(): void;
  /** Get buffered output (requires saveBuffer mode) */
  getBuffer(): Promise<ArrayBuffer>;
  /** Get all written & pending file paths */
  getFiles(): string[];
  /**
   * Get observed zip size after all pending writes are resolved
   */
  getSize(): Promise<number>;
}

type ZipProgressDetails = {
  /** Percentage completed. `null` indicates indetermination */
  percent: number | null;
  /** The number of bytes or items written so far */
  written: number;
  /** The total number of bytes or items to write. `null` indicates indetermination */
  size: number | null;
};
```

Example:

```ts
const files = [
  {
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
    name: 'tortoise.jpg',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  },
];
const writer = penumbra.saveZip();
await writer.write(...(await penumbra.get(...files)));
await writer.close();
```

### .setWorkerLocation

Configure the location of Penumbra's worker threads.

```ts
penumbra.setWorkerLocation(location: WorkerLocationOptions | string): Promise<void>
```

## Examples

### Display encrypted text

```js
const decryptedText = await penumbra
  .get({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
    mimetype: 'text/plain',
    filePrefix: 'NYT',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  })
  .then((file) => penumbra.getTextOrURI(file)[0])
  .then(({ data }) => {
    document.getElementById('my-paragraph').innerText = data;
  });
```

### Display encrypted image

```js
const imageSrc = await penumbra
  .get({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
    filePrefix: 'tortoise',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  })
  .then((file) => penumbra.getTextOrURI(file)[0])
  .then(({ data }) => {
    document.getElementById('my-img').src = data;
  });
```

### Download an encrypted file

```js
penumbra
  .get({
    url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/africa.topo.json.enc',
    filePrefix: 'africa',
    mimetype: 'image/jpeg',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  })
  .then((file) => penumbra.save(file));

// saves africa.jpg file to disk
```

### Download many encrypted files

```js
penumbra
  .get([
    {
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/africa.topo.json.enc',
      filePrefix: 'africa',
      mimetype: 'image/jpeg',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
      },
    },
    {
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
      mimetype: 'text/plain',
      filePrefix: 'NYT',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'gadZhS1QozjEmfmHLblzbg==',
      },
    },
    {
      url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg', // this is not encrypted
      filePrefix: 'tortoise',
      mimetype: 'image/jpeg',
    },
  ])
  .then((files) => penumbra.save({ data: files, fileName: 'example' }));

// saves example.zip file to disk
```

## Advanced

### Prepare connections for file downloads in advance

```js
// Resources to load
const resources = [
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
];

// preconnect to the origins
penumbra.preconnect(...resources);

// or preload all of the URLS
penumbra.preload(...resources);
```

### Encrypt/Decrypt Job Completion Event Emitter

You can listen to encrypt/decrypt job completion events through the `penumbra-complete` event.

```js
window.addEventListener(
  'penumbra-complete',
  ({ detail: { id, decryptionInfo } }) => {
    console.log(
      `finished encryption job #${id}%. decryption options:`,
      decryptionInfo,
    );
  },
);
```

### Progress Event Emitter

You can listen to download and encrypt/decrypt job progress events through the `penumbra-progress` event.

```js
window.addEventListener(
  'penumbra-progress',
  ({ detail: { percent, id, type } }) => {
    console.log(`${type}% ${percent}% done for ${id}`);
    // example output: decrypt 33% done for https://example.com/encrypted-data
  },
);
```

Note: this feature requires the `Content-Length` response header to be exposed. This works by adding `Access-Control-Expose-Headers: Content-Length` to the response header (read more [here](https://www.html5rocks.com/en/tutorials/cors/) and [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers))

On Amazon S3, this means adding the following line to your bucket policy, inside the `<CORSRule>` block:

```xml
<ExposeHeader>Content-Length</ExposeHeader>
```

### Configure worker location

```ts
// Set only the base URL by passing a string
penumbra.setWorkerLocation('/penumbra-workers/');

// Set all worker URLs by passing a WorkerLocation object
penumbra.setWorkerLocation({
  base: '/penumbra-workers/',
  penumbra: 'worker.penumbra.js',
  StreamSaver: 'StreamSaver.js',
});

// Set a single worker's location
penumbra.setWorkerLocation({ penumbra: 'worker.penumbra.js' });
```

### Waiting for the `penumbra-ready` event

```html
<script src="lib/main.penumbra.js" async defer></script>
```

```ts
const onReady = async ({ detail: { penumbra } } = { detail: self }) => {
  await penumbra.get(...files).then(penumbra.save);
};

if (!self.penumbra) {
  self.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
```

### Querying Penumbra browser support

You can check if Penumbra is supported by the current browser by comparing `penumbra.supported(): PenumbraSupportLevel` with `penumbra.supported.levels`.

```ts
if (penumbra.supported() > penumbra.supported.levels.possible) {
  // penumbra is partially or fully supported
}

/** penumbra.supported.levels - Penumbra user agent support levels */
enum PenumbraSupportLevel {
  /** Old browser where Penumbra does not work at all */
  none = -0,
  /** Modern browser where Penumbra is not yet supported */
  possible = 0,
  /** Modern browser where file size limit is low */
  size_limited = 1,
  /** Modern browser with full support */
  full = 2,
}
```

## Webpack

Penumbra is compiled and bundled on npm. The recommended use is to copy in the penumbra build files into your webpack build.
We do this with `copy-webpack-plugin`

i.e.

```js
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const PENUMBRA_DIRECTORY = path.join(
  __dirname,
  'node_modules',
  '@transcend-io/penumbra',
  'build',
);

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: fs.readdirSync(PENUMBRA_DIRECTORY)
        .filter((fil) => fil.indexOf('.') > 0)
        .map((fil) => ({
          from: `${PENUMBRA_DIRECTORY}/${fil}`,
          to: `${outputPath}/${fil}`,
        })),
    }),
  ]
```

## Contributing

```bash
# setup
yarn
yarn build

# run tests
yarn test:local

# run tests in the browser console
yarn test:interactive
```

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra?ref=badge_large)
