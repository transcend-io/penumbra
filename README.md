# Usage

Display an encrypted file

```js
// Decrypt and display text
getDecryptedContent({url, key, iv, authTag, mime /*== 'text/plain'*/})
  .then(decryptedText => {
    document.getElementById('my-paragraph').innerText = decryptedText;
  });

// Decrypt and display media
getDecryptedContent({url, key, iv, authTag, mime /*== 'image/jpeg'*/})
  .then(imageSrc => {
    document.getElementById('my-img').src = imageSrc;
  });
```

Download an encrypted file

```js
downloadEncryptedFile({
  url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/africa.topo.json.enc',
  key,
  iv,
  authTag,
  fileName: 'myFile.json', // optional values
  progressEventName: 'download-progress' // defaults to the url
});
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
