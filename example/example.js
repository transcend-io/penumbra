/*
 * TODO
 * check authtag with decipher.final()
 * see if we can create the dataUri before and buffer in
 * import * as render from 'render-media';
 */

import * as Comlink from 'comlink';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { downloadEncryptedFile, getDecryptedContent } from '../build/index';
import * as files from './files';

const USE_SERVICE_WORKER = true;
const app = document.getElementById('app');

const S3_URL = 'https://s3-us-west-2.amazonaws.com/bencmbrook/';

const Penumbra = USE_SERVICE_WORKER
  ? // Offload penumbra processing to service worker
    Comlink.wrap(new Worker('./decryption.worker.js', { type: 'module' }))
  : // Perform penumbra processing on main thread
    function Penumbra() {
      // For testing without a service worker
      return Promise.resolve({
        downloadEncryptedFile,
        getDecryptedContent,
      });
    };

/**
 * Add progress indicator to app
 *
 * @param url - URL to listen for progress updates
 */
function addProgressIndicator(url) {
  const progressElt = document.createElement('h3');
  app.appendChild(progressElt);

  // Display load progress for image
  window.addEventListener(url, (e) => {
    const kb = Math.round(e.detail.contentLength / 1024);
    let mb;
    if (kb > 1024) {
      mb = Math.round(kb / 1024);
    }
    const sizeStr = mb ? `${mb}MB` : `${kb}KB`;

    if (e.detail.percent < 100) {
      progressElt.innerText = `${url}\n${sizeStr}\ndecryption progress ${e.detail.percent}%`;
    } else {
      progressElt.innerText = `${url}\n${sizeStr}`;
    }
  });
}

/**
 * Add download link to the app
 *
 * @param file - File path to load
 */
function addDownloadLink(file) {
  const button = document.createElement('button');
  button.innerText = `Download ${file.path}`;
  button.onclick = () => {
    downloadEncryptedFile({ url: S3_URL + file.path, ...file });
  };
  app.appendChild(button);
}

/**
 * Display text in the demo
 *
 * @param file - File path to load
 */
function displayText(file) {
  const url = S3_URL + file.path;

  addProgressIndicator(url);
  addDownloadLink(file);

  const text = document.createElement('p');
  app.appendChild(text);

  new Penumbra()
    .then((instance) => instance.getDecryptedContent({ url, ...file }))
    // getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime)
    .then((txt) => {
      text.innerText = txt;
    })
    .catch(console.error);
}

/**
 * Display image in the demo
 *
 * @param file - File path to load
 */
function displayImage(file) {
  const url = S3_URL + file.path;

  addProgressIndicator(url);
  addDownloadLink(file);

  const image = document.createElement('img');
  app.appendChild(image);

  // Display image
  new Penumbra()
    .then((instance) => instance.getDecryptedContent({ url, ...file }))
    .then((url2) => {
      image.src = url2;
    });
}

/**
 * Display video in the demo
 *
 * @param - file File path to load
 */
function displayVideo(file) {
  const url = S3_URL + file.path;

  addProgressIndicator(url);
  addDownloadLink(file);

  const video = document.createElement('video');
  app.appendChild(video);

  const source = document.createElement('source');
  video.appendChild(source);

  video.addEventListener('error', (err) => {
    console.error(video.error, err);
  });

  source.addEventListener('error', (err) => {
    console.error(err);
  });

  // Display video
  new Penumbra()
    .then((instance) => instance.getDecryptedContent({ url, ...file }))
    // getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime)
    .then((src) => {
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

/**
 * Downloads many files, creates a ZIP, and saves it
 *
 * @param file - File path to load
 */
function downloadMany(fileList) {
  const zip = new JSZip();

  const folder1 = zip.folder('Profile Data');
  const folder2 = zip.folder('Activity Log');

  let tick = false;

  Object.keys(fileList).forEach((fileName) => {
    const decryptedBlobPromise = getDecryptedContent(
      {
        ...fileList[fileName],
        url: S3_URL + fileList[fileName].filePrefix,
      },
      fileList[fileName],
      true,
    );

    tick = !tick;
    if (tick) {
      folder1.file(fileName, decryptedBlobPromise);
    } else {
      folder2.file(fileName, decryptedBlobPromise);
    }
  });

  zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, 'export.zip');
  });
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Call downloadMany() with a pre-set file list
 */
function downloadManyFiles() {
  downloadMany(files);
}
/* eslint-enable @typescript-eslint/no-unused-vars */

displayText(files['NYT.txt']);
displayImage(files['river.jpg']);
displayVideo(files['patreon.mp4']);
displayVideo(files['k.webm']);
displayImage(files['turtl.gif']);
