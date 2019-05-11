## Download Progress Event Emitter

You can listen to a download progress event. The event _type_ is the same as the `url` parameter

```js
window.addEventListener(url, e => {
  console.log(`${e.detail}% done`);
});
```

Note: this requires the `Content-Length` response header to be exposed. This works by adding `Access-Control-Expose-Headers: Content-Length` to the response header (read more [here](https://www.html5rocks.com/en/tutorials/cors/) and [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers))

On Amazon S3, this means adding the following line to your bucket policy, inside the `<CORSRule>` block:

```xml
<ExposeHeader>Content-Length</ExposeHeader>
```
