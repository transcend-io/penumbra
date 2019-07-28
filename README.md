<p align="center">
  <img alt="Penumbra by Transcend" src="https://user-images.githubusercontent.com/7354176/61583246-43519500-aaea-11e9-82a2-e7470f3d4e00.png"/>
</p>
<h1 align="center">Penumbra</h1>
<p align="center">
  <strong>Fetch and decrypt files in the browser using whatwg streams and web workers.</strong>
  <br /><br />
  <i>Coming soon. This repo is currently a work in progress.</i>
  <br /><br />
  <a href="https://travis-ci.com/transcend-io/penumbra"><img src="https://travis-ci.com/transcend-io/penumbra.svg?branch=master" alt="Build Status"></a>
  <a href="https://snyk.io//test/github/transcend-io/penumbra?targetFile=package.json"><img src="https://snyk.io//test/github/transcend-io/penumbra/badge.svg?targetFile=package.json" alt="Known Vulnerabilities"></a>
  <a href="https://codecov.io/gh/transcend-io/penumbra"><img src="https://codecov.io/gh/transcend-io/penumbra/branch/master/graph/badge.svg" alt="Code Coverage"></a>
  <a href="https://app.netlify.com/sites/penumbra-demo/deploys"><img src="https://api.netlify.com/api/v1/badges/533125dc-c7af-4442-af32-df7283c7322b/deploy-status" alt="Netlify Status"></a>
  <br /><br />
  <a href="https://saucelabs.com/u/penumbra"><img src="https://saucelabs.com/browser-matrix/penumbra.svg?auth=c2b96594999df3d684c9af8d63a0c61e" alt="Sauce Test Status"></a>
</p>
<br />

## Usage

### .get

Fetch and decrypt remote files

```ts
penumbra.get(...resources: RemoteResource[]): Promise<PenumbraFiles[]>
```

### .save

Save files retrieved by Penumbra

```ts
penumbra.save(data: PenumbraFiles, fileName?: string): Promise<void>
```

### .getBlob

Load files retrieved by Penumbra into memory as a Blob

```ts
penumbra.getBlob(data: PenumbraFiles): Promise<Blob>
```

### .getTextOrURI

Get file text (if content is text) or [URI](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) (if content is not viewable).

```ts
penumbra.getTextOrURI(data: PenumbraFiles): Promise<{ type: 'text'|'uri', data: string }>
```

### .zip

Zip files retrieved by Penumbra

```ts
penumbra.zip(data: PenumbraFiles, compressionLevel?: number): Promise<ReadableStream>
```

### .setWorkerLocation

Configure the location of Penumbra's worker threads

```ts
penumbra.setWorkerLocation(location: WorkerLocationOptions | string): Promise<void>
```

### `penumbra-ready` event

Listen for this event to know when Penumbra is ready to be used.

```ts
self.addEventListener('penumbra-ready', async ({ detail: { penumbra } }) => {
  // await penumbra.get(...);
});
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
  .then((file) => penumbra.getTextOrURI(file));

document.getElementById('my-paragraph').innerText = decryptedText;
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
  .then((file) => penumbra.getTextOrURI(file));

document.getElementById('my-img').src = imageSrc;
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

```ts
const onReady = async ({ detail: { penumbra } } = { detail: self }) => {
  // await penumbra.get(...);
};

if (!self.penumbra) {
  self.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
```

### Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs][homepage]

[homepage]: https://saucelabs.com
