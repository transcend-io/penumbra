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
  <a href="https://snyk.io//test/github/transcend-io/penumbra?targetFile=package.json"><img src="https://snyk.io//test/github/transcend-io/penumbra/badge.svg?targetFile=package.json" alt="Known Vulnerabilities"></a>
  <a href="https://automate.browserstack.com/public-build/UTM2bUZraHZxdzVwdEZjMjE1dUZKbkE2K0FlQlkyWmFlNW42bVBISmlTTT0tLW5JNDVzRUpnZVBNT09HQy9za2tUeFE9PQ==--a1fb760eef52522b746c59cbfbed9ba7394f36ec"><img src='https://automate.browserstack.com/badge.svg?badge_key=UTM2bUZraHZxdzVwdEZjMjE1dUZKbkE2K0FlQlkyWmFlNW42bVBISmlTTT0tLW5JNDVzRUpnZVBNT09HQy9za2tUeFE9PQ==--a1fb760eef52522b746c59cbfbed9ba7394f36ec'/></a>
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
  - [Download Progress Event Emitter](#download-progress-event-emitter)
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

### Download Progress Event Emitter

You can listen to download progress events by listening to the `penumbra-progress` event.

```js
window.addEventListener(
  'penumbra-progress',
  ({ detail: { percent, url, type } }) => {
    console.log(`${type}% ${percent}% done for ${url}`);
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
