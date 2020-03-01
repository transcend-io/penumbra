<p align="center">
  <img alt="Penumbra by Transcend" src="https://user-images.githubusercontent.com/7354176/61583246-43519500-aaea-11e9-82a2-e7470f3d4e00.png"/>
</p>
<h1 align="center">Penumbra</h1>
<p align="center">
  <strong>Fetch and decrypt files in the browser using whatwg streams and web workers.</strong>
  <br /><br />
  <i>Quickly and efficiently decrypt remote resources in the browser. Display the files in the DOM, or download them with <a href="https://github.com/transcend-io/conflux">conflux</a>.</i>
  <br /><br />
  <a href="https://travis-ci.com/transcend-io/penumbra"><img src="https://travis-ci.com/transcend-io/penumbra.svg?branch=master" alt="Build Status"></a>
  <a href="https://automate.browserstack.com/public-build/SmJHL1l4Q1hTZkFZMlBCWnBDcElEZndaWFgxbklqdTd5UkxDMFBISUdEST0tLUU2SFdLazhFd1BWU2NjSU1NcWdpS3c9PQ==--1c3006209d588dbf401864442d5b60b191f05025%"><img src='https://automate.browserstack.com/badge.svg?badge_key=SmJHL1l4Q1hTZkFZMlBCWnBDcElEZndaWFgxbklqdTd5UkxDMFBISUdEST0tLUU2SFdLazhFd1BWU2NjSU1NcWdpS3c9PQ==--1c3006209d588dbf401864442d5b60b191f05025%'/></a>
  <a href="https://snyk.io//test/github/transcend-io/penumbra?targetFile=package.json"><img src="https://snyk.io//test/github/transcend-io/penumbra/badge.svg?targetFile=package.json" alt="Known Vulnerabilities"></a>
  <a href="https://app.fossa.io/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra?ref=badge_shield" alt="FOSSA Status"><img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra.svg?type=shield"/></a>
  <a href="https://codecov.io/gh/transcend-io/penumbra"><img src="https://codecov.io/gh/transcend-io/penumbra/branch/master/graph/badge.svg" alt="Code Coverage"></a>
  <a href="https://codeclimate.com/github/transcend-io/penumbra/maintainability"><img src="https://api.codeclimate.com/v1/badges/b87db99b427788ea3ce9/maintainability" /></a>
  <a href="https://app.netlify.com/sites/penumbra-demo/deploys"><img src="https://api.netlify.com/api/v1/badges/533125dc-c7af-4442-af32-df7283c7322b/deploy-status" alt="Netlify Status"></a>
</p>
<br />

<!-- toc -->

- [Usage](#usage)
  - [Importing Penumbra](#importing-penumbra)
    - [With NPM](#with-npm)
    - [Vanilla JS](#vanilla-js)
  - [.get](#get)
  - [.encrypt](#encrypt)
  - [.getDecryptionInfo](#getdecryptioninfo)
  - [.decrypt](#decrypt)
  - [.save](#save)
  - [.getBlob](#getblob)
  - [.getTextOrURI](#gettextoruri)
  - [.zip](#zip)
  - [.setWorkerLocation](#setworkerlocation)
- [Examples](#examples)
  - [Display encrypted text](#display-encrypted-text)
  - [Display encrypted image](#display-encrypted-image)
  - [Download an encrypted file](#download-an-encrypted-file)
  - [Download many encrypted files](#download-many-encrypted-files)
- [Advanced](#advanced)
  - [Prepare connections for file downloads in advance](#prepare-connections-for-file-downloads-in-advance)
  - [Encryption Completion Event Emitter](#encryption-completion-event-emitter)
  - [Progress Event Emitter](#progress-event-emitter)
  - [Configure worker location](#configure-worker-location)
  - [Waiting for the `penumbra-ready` event](#waiting-for-the-penumbra-ready-event)
- [Contributing](#contributing)
- [License](#license)

<!-- tocstop -->

## Usage

### Importing Penumbra

#### With NPM

```sh
npm install --save @transcend-io/penumbra
```

```js
import { penumbra } from '@transcend-io/penumbra';

penumbra.get(...files).then(penumbra.save);
```

#### Vanilla JS

```html
<script src="lib/penumbra.js"></script>
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
addEventListener('penumbra-encryption-complete', (e) =>
  console.log(e.type, e.detail),
);
file = penumbra.encrypt(null, { stream: new Uint8Array(size), size });
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
const { intoStream } = self;
const te = new TextEncoder();
const td = new TextDecoder();
const data = te.encode('test');
const { byteLength: size } = data;
const [encrypted] = await penumbra.encrypt(null, {
  stream: intoStream(data),
  size,
});
const options = await penumbra.getDecryptionInfo(encrypted);
const [decrypted] = await penumbra.decrypt(options, encrypted);
const decryptedData = await new Response(decrypted.stream).arrayBuffer();
return td.decode(decryptedData) === 'test';
```

### .save

Save files retrieved by Penumbra. Downloads a .zip if there are multiple files.

```ts
penumbra.save(data: PenumbraFile[], fileName?: string): Promise<void>
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

### .zip

Zip files retrieved by Penumbra.

```ts
penumbra.zip(data: PenumbraFile[] | PenumbraFile, compressionLevel?: number): Promise<ReadableStream>
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

### Encryption Completion Event Emitter

You can listen to download progress events by listening to the `penumbra-encryption-complete` event.

```js
window.addEventListener(
  'penumbra-encryption-complete',
  ({ detail: { id, decryptionInfo } }) => {
    console.log(
      `finished encryption job #${id}%. decryption options:`,
      decryptionInfo,
    );
  },
);
```

### Progress Event Emitter

You can listen to download and encryption progress events by listening to the `penumbra-progress` event.

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
  decrypt: 'decrypt.js'
  zip: 'zip-debug.js' // e.g. manually use a debug worker
  StreamSaver: 'StreamSaver.js'
});

// Set a single worker's location
penumbra.setWorkerLocation({decrypt: 'penumbra.decrypt.js'});
```

### Waiting for the `penumbra-ready` event

```html
<script src="lib/penumbra.js" async defer></script>
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

## Contributing

```bash
# setup
npm install
npm run build

# start tests and open a browser to localhost:8080
npm run test:interactive
```

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra?ref=badge_large)
