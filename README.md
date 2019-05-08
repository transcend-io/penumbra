# Penumbra

Crypto streams for the browser.

# Load data
## .fetch()
Fetch remote file as a ReadableStream.

## .blob()
Load a blob as a ReadableStream.

## .upload()
Upload file to a remote URL.

# Encryption
## .decrypt()
Decrypt a ReadableStream
`penumbra.fetch(url).decrypt().display()`

## .encrypt()
Encrypt a ReadableStream
`penumbra.blob(someBlob).encrypt().upload()`

# Usage
## .display()
`penumbra.fetch(url).decrypt().display()`

## .save()
`penumbra.fetch(url).decrypt().save()`


