# Penumbra (work in progress)
  
Note: this repo is a work in progress and should not be used in production yet.

[![Build Status](https://travis-ci.com/transcend-io/penumbra.svg?token=XTquxQxQzsVSbyH7sopX&branch=master)](https://travis-ci.com/transcend-io/penumbra)
[![Netlify Status](https://api.netlify.com/api/v1/badges/533125dc-c7af-4442-af32-df7283c7322b/deploy-status)](https://app.netlify.com/sites/penumbra-demo/deploys)

## Usage

Display an encrypted file

```js
// Decrypt and display text
const decryptedText = await penumbra.getDecryptedContent({
  url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/NYT.txt.enc',
  filePrefix: 'NYT',
  mimetype: 'text/plain',
  decryptionOptions: {
    key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
    iv: '6lNU+2vxJw6SFgse',
    authTag: 'gadZhS1QozjEmfmHLblzbg==',
  },
});

document.getElementById('my-paragraph').innerText = decryptedText;


// Decrypt and display media
const imageSrc = await penumbra.getDecryptedContent({
  url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/tortoise.jpg.enc',
  filePrefix: 'tortoise',
  mimetype: 'image/jpeg',
  decryptionOptions: {
    key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
    iv: '6lNU+2vxJw6SFgse',
    authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
  },
})

document.getElementById('my-img').src = imageSrc;
```

Download an encrypted file

```js
penumbra.downloadEncryptedFile({
  url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/africa.topo.json.enc',
  filePrefix: 'africa',
  mimetype: 'image/jpeg',
  decryptionOptions: {
    key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
    iv: '6lNU+2vxJw6SFgse',
    authTag: 'ELry8dZ3djg8BRB+7TyXZA==',
  },
  progressEventName: 'download-progress' // defaults to the url
});
```

## Prepare connections for file downloads in advance

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
  }
]

// preconnect to the origins
penumbra.preconnect(...resources);

// or preload all of the URLS
penumbra.preload(...resources);
```

## Download Progress Event Emitter

You can listen to a download progress event. The event name is the same as the `url` parameter

```js
window.addEventListener(url, e => {
  console.log(`${e.detail}% done`);
});
```

Note: this feature requires the `Content-Length` response header to be exposed. This works by adding `Access-Control-Expose-Headers: Content-Length` to the response header (read more [here](https://www.html5rocks.com/en/tutorials/cors/) and [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers))

On Amazon S3, this means adding the following line to your bucket policy, inside the `<CORSRule>` block:

```xml
<ExposeHeader>Content-Length</ExposeHeader>
```
