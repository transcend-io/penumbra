/*
 * TODOs
 * check authtag with decipher.final()
 * see if we can create the dataUri before and buffer in
 * import * as render from 'render-media';
 */


import { downloadEncryptedFile, getDecryptedContent } from '../dist/index';
import * as files from './files';
import * as Comlink from 'comlink';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';


const USE_SERVICE_WORKER = true;
const app = document.getElementById('app');

const Penumbra = USE_SERVICE_WORKER
  ? // Offload penumbra processing to service worker
  Comlink.wrap(
    new Worker('./decryption.worker.js', { type: 'module' })
  )
  : // Perform penumbra processing on main thread
  function Penumbra() {
  // For testing without a service worker
  return Promise.resolve({
    downloadEncryptedFile,
    getDecryptedContent,
  });
};


function displayText(file) {
  const url = `https://s3-us-west-2.amazonaws.com/bencmbrook/${file.path}`;

  addProgressIndicator(url);
  addDownloadLink(file);

  const text = document.createElement('p');
  app.appendChild(text);

  new Penumbra()
    .then(instance => instance.getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime))
  // getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime)
    .then(txt => (text.innerText = txt))
    .catch(console.error);
}


function displayImage(file) {
  const url = `https://s3-us-west-2.amazonaws.com/bencmbrook/${file.path}`;

  addProgressIndicator(url); 
  addDownloadLink(file);

  const image = document.createElement('img');
  app.appendChild(image);

  // Display image
  new Penumbra()
    .then(instance => instance.getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime))
    .then(url => (image.src = url));
}


function displayVideo(file) {
  const url = `https://s3-us-west-2.amazonaws.com/bencmbrook/${file.path}`;

  addProgressIndicator(url);
  addDownloadLink(file);

  const video = document.createElement('video');
  app.appendChild(video);

  const source = document.createElement('source');
  video.appendChild(source);

  video.addEventListener('error', err => {
    console.error(video.error, err);
  });

  source.addEventListener('error', err => {
    console.error(err);
  });

  // Display video
  new Penumbra()
    .then(instance => instance.getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime))
  // getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime)
    .then(src => {
      source.type = file.mime;
      source.src = src;
      video.src = src;
      video.controls = true;
      video.muted = true;
      video.playsinline = true;
      video.autoplay = true;
    })
    .catch(console.error);
}


function downloadMany(files) {
  const zip = new JSZip();

  let folder1 = zip.folder('Profile Data');
  let folder2 = zip.folder('Activity Log');

  let tick = false;

  Object.keys(files).forEach(fileName => {
    const { key, iv, authTag, mime, path } = files[fileName];
    const url = `https://s3-us-west-2.amazonaws.com/bencmbrook/${path}`;

    const decryptedBlobPromise = getDecryptedContent(url, key, iv, authTag, mime, { alwaysBlob: true });

    tick = !tick;
    if (tick) {
      folder1.file(fileName, decryptedBlobPromise);
    } else {
      folder2.file(fileName, decryptedBlobPromise);
    }
  });

  zip.generateAsync({ type: "blob" })
  .then((content) => {
    saveAs(content, "export.zip");
  });
}


function addProgressIndicator(url) {
  const progressElt = document.createElement('h3');
  app.appendChild(progressElt);

  // Display load progress for image
  window.addEventListener(url, e => {
    const kb = Math.round(e.detail.contentLength / 1024);
    let mb;
    if (kb > 1024) mb = Math.round(kb / 1024);
    const sizeStr = mb ? `${mb}MB` : `${kb}KB`;

    if (e.detail.percent < 100) {
      progressElt.innerText = `${url}\n${sizeStr}\ndecryption progress ${
        e.detail.percent
      }%`;
    } else {
      progressElt.innerText = `${url}\n${sizeStr}`;
    }
  });
}


function addDownloadLink(file) {
  const button = document.createElement('button');
  button.innerText = `Download ${file.path}`;
  button.onclick = () => {
    downloadEncryptedFile(
      `https://s3-us-west-2.amazonaws.com/bencmbrook/${file.path}`,
      file.key,
      file.iv,
      file.authTag,
      {
        fileName: null,
        mime: file.mime,
      }
    );
  };
  app.appendChild(button);
}

function downloadManyFiles() {
  downloadMany(files);
}

displayText(files['NYT.txt']);
displayImage(files['river.jpg']);
displayVideo(files['patreon.mp4']);
displayVideo(files['k.webm']);
displayImage(files['turtl.gif']);
