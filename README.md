# Penumbra

Crypto streams for the browser.

# Read
## .fetch()
Fetch remote file as a ReadableStream.

## .blob()
Load a blob as a ReadableStream.

## Write
## .upload()
Upload file to a remote URL.

## .save()
`penumbra.fetch(url).decrypt().save()`

## .display()
Display in HTML doc
`penumbra.fetch(url).decrypt().display()`

# Encryption
## .decrypt()
Decrypt a ReadableStream
`penumbra.fetch(url).decrypt().display()`

## .encrypt()
Encrypt a ReadableStream
`penumbra.blob(someBlob).encrypt().upload()`

