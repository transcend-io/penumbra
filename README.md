<p align="center">
  <img alt="Penumbra by Transcend" src="https://user-images.githubusercontent.com/7354176/61583246-43519500-aaea-11e9-82a2-e7470f3d4e00.png"/>
</p>
<h1 align="center">Penumbra</h1>
<p align="center">
  <strong>Encrypt/decrypt anything in the browser using streams on background threads.</strong>
  <br /><br />
  <i>Quickly and efficiently decrypt remote resources in the browser. Display the files in the DOM, or download them with <a href="https://github.com/transcend-io/conflux">conflux</a>.</i>
  <br /><br />
  <a href="https://snyk.io//test/github/transcend-io/penumbra?targetFile=package.json"><img src="https://snyk.io//test/github/transcend-io/penumbra/badge.svg?targetFile=package.json" alt="Known Vulnerabilities"></a>
  <a href="https://app.fossa.io/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra?ref=badge_shield" alt="FOSSA Status"><img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra.svg?type=shield"/></a>
</p>
<br />

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Compatibility](#compatibility)
- [Usage](#usage)
  - [Importing Penumbra](#importing-penumbra)
  - [RemoteResource](#remoteresource)
  - [.get](#get)
  - [.encrypt](#encrypt)
  - [.getDecryptionInfo](#getdecryptioninfo)
  - [.decrypt](#decrypt)
  - [.save](#save)
  - [.getBlob](#getblob)
  - [.getTextOrURI](#gettextoruri)
  - [.saveZip](#savezip)
- [Examples](#examples)
  - [Display encrypted text](#display-encrypted-text)
  - [Display encrypted image](#display-encrypted-image)
  - [Download an encrypted file](#download-an-encrypted-file)
  - [Download many encrypted files](#download-many-encrypted-files)
- [Advanced](#advanced)
  - [Prepare connections for file downloads in advance](#prepare-connections-for-file-downloads-in-advance)
  - [Encrypt/Decrypt Job Completion Event Emitter](#encryptdecrypt-job-completion-event-emitter)
  - [Progress Event Emitter](#progress-event-emitter)
  - [Querying Penumbra browser support](#querying-penumbra-browser-support)
- [Contributing](#contributing)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Compatibility

|              | .decrypt | .encrypt | .saveZip |
| ------------ | -------: | -------: | -------: |
| Chrome       |       ✅ |       ✅ |       ✅ |
| Edge >18     |       ✅ |       ✅ |       ✅ |
| Safari ≥14.1 |       ✅ |       ✅ |       ✅ |
| Firefox ≥102 |       ✅ |       ✅ |       ✅ |

✅ = Full support with workers

## Usage

### Importing Penumbra

```sh
npm install --save @transcend-io/penumbra
```

```js
import { penumbra } from '@transcend-io/penumbra';

penumbra.get(...files).then(penumbra.save);
```

### RemoteResource

`penumbra.get()` uses RemoteResource descriptors to specify where to request resources and their various decryption parameters.

```ts
/**
 * A file to download from a remote resource, that is optionally encrypted
 */
type RemoteResource = {
  /** The URL to fetch the encrypted or unencrypted file from */
  url: string;
  /** The mimetype of the resulting file */
  mimetype?: string;
  /** The name of the underlying file without the extension */
  filePrefix?: string;
  /** If the file is encrypted, these are the required params */
  decryptionOptions?: PenumbraDecryptionOptions;
  /** Relative file path (needed for zipping) */
  path?: string;
  /** Fetch options */
  requestInit?: RequestInit;
  /** Last modified date */
  lastModified?: Date;
  /** Expected file size */
  size?: number;
};
```

### .get

Fetch and decrypt remote files.

```ts
penumbra.get(...resources: RemoteResource[]): Promise<PenumbraFile[]>
```

### .encrypt

Encrypt files.

```ts
penumbra.encrypt(options: PenumbraEncryptionOptions, ...files: PenumbraFile[]): Promise<PenumbraEncryptedFile[]>

/**
 * penumbra.encrypt() encryption options config (Uint8Array or base64-encoded string)
 */
type PenumbraEncryptionOptions = {
  /** Encryption key */
  key: string | Uint8Array;
};
```

#### .encrypt() examples:

Encrypt an empty stream:

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

Encrypt and decrypt text:

```ts
const te = new self.TextEncoder();
const td = new self.TextDecoder();
const input = '[test string]';
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
const decryptedData = await new Response(decrypted.stream).arrayBuffer();
const decryptedText = td.decode(decryptedData);
console.log('decrypted text:', decryptedText);
```

### .getDecryptionInfo

Get decryption info for a file, including the iv, authTag, and key. This may only be called on files that have finished being encrypted.

```ts
penumbra.getDecryptionInfo(file: PenumbraFile): Promise<PenumbraDecryptionOptions>
```

### .decrypt

Decrypt files.

```ts
penumbra.decrypt(options: PenumbraDecryptionOptions, ...files: PenumbraEncryptedFile[]): Promise<PenumbraFile[]>
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
    url: 'https://s3-us-west-2.amazonaws.com/your-bucket/tortoise.jpg.enc',
    filePrefix: 'tortoise.jpg',
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

## Examples

### Display encrypted text

```js
const decryptedText = await penumbra
  .get({
    url: 'https://s3-us-west-2.amazonaws.com/your-bucket/NYT.txt.enc',
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
    url: 'https://s3-us-west-2.amazonaws.com/your-bucket/tortoise.jpg.enc',
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
    url: 'https://s3-us-west-2.amazonaws.com/your-bucket/africa.topo.json.enc',
    filePrefix: 'africa.topo.json',
    mimetype: 'application/json',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
    },
  })
  .then((file) => penumbra.save(file));

// saves africa.topo.json file to disk
```

### Download many encrypted files

```js
penumbra
  .get(
    {
      url: 'https://s3-us-west-2.amazonaws.com/your-bucket/africa.topo.json.enc',
      filePrefix: 'africa',
      mimetype: 'image/jpeg',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
      },
    },
    {
      url: 'https://s3-us-west-2.amazonaws.com/your-bucket/NYT.txt.enc',
      mimetype: 'text/plain',
      filePrefix: 'NYT',
      decryptionOptions: {
        key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
        iv: '6lNU+2vxJw6SFgse',
        authTag: 'gadZhS1QozjEmfmHLblzbg==',
      },
    },
    {
      url: 'https://s3-us-west-2.amazonaws.com/your-bucket/tortoise.jpg', // this is not encrypted
      filePrefix: 'tortoise',
      mimetype: 'image/jpeg',
    },
  )
  .then((files) => penumbra.save(files, 'example'));

// saves example.zip file to disk
```

## Advanced

### Prepare connections for file downloads in advance

```js
// Resources to load
const resources = [
  {
    url: 'https://s3-us-west-2.amazonaws.com/your-bucket/NYT.txt.enc',
    filePrefix: 'NYT',
    mimetype: 'text/plain',
    decryptionOptions: {
      key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
      iv: '6lNU+2vxJw6SFgse',
      authTag: 'gadZhS1QozjEmfmHLblzbg==',
    },
  },
  {
    url: 'https://s3-us-west-2.amazonaws.com/your-bucket/tortoise.jpg.enc',
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

### Querying Penumbra browser support

You can check if Penumbra is supported by the current browser by comparing `penumbra.supported(): PenumbraSupportLevel` with `penumbra.supported.levels`.

```ts
if (penumbra.supported() > penumbra.supported.levels.none) {
  // penumbra is supported
}

/** penumbra.supported.levels - Penumbra user agent support levels */
enum PenumbraSupportLevel {
  /** Old browser where Penumbra does not work at all */
  none = -0,
  /** Modern browser with full support */
  full = 2,
}
```

Everything Penumbra uses is widely supported by modern browsers, but depending on your browser target, you can load polyfills for:

- `TransformStream`
- `WritableStream`
- `ReadableStream`
- `CustomEvent`
- `Proxy`
- `BigInt` (if using `penumbra.saveZip`)

## Contributing

```bash
# setup
pnpm install
pnpm build

# run tests
pnpm test
```

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Ftranscend-io%2Fpenumbra?ref=badge_large)
