/*
 * TODOs
 * check authtag with decipher.final()
 * see if we can create the dataUri before and buffer in
 */

import { downloadEncryptedFile, getDecryptedContent } from '../dist/index';
import * as files from './files';
import * as Comlink from 'comlink';

const Fetcher = Comlink.wrap(
  new Worker('./sw.js', { type: 'module' })
);

(new Fetcher()).then(fetcher => {
  fetcher.logSomething();
});

// import * as render from 'render-media';

const app = document.getElementById('app');

function displayText(file) {
  const url = `https://s3-us-west-2.amazonaws.com/bencmbrook/${file.path}`;

  addProgressIndicator(url);
  addDownloadLink(file);

  const text = document.createElement('p');
  app.appendChild(text);

  getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime).then(
    txt => (text.innerText = txt)
  );
}

function displayImage(file) {
  const url = `https://s3-us-west-2.amazonaws.com/bencmbrook/${file.path}`;

  addProgressIndicator(url); 
  addDownloadLink(file);

  const image = document.createElement('img');
  app.appendChild(image);

  // Display image
  getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime).then(
    url => (image.src = url)
  );
}

// function displayVideo(file) {
//   const url = `https://s3-us-west-2.amazonaws.com/bencmbrook/${file.path}`;

//   addProgressIndicator(url);
//   addDownloadLink(file);

//   // Display video
//   getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime)
//     .then(rs => {
//       render.append(
//         {
//           name: file.path
//             .split('.')
//             .slice(0, -1)
//             .join('.'),
//           createReadStream: () => rs,
//         },
//         app,
//         (err, elem) => {
//           console.log('kjhljk');
//           if (err) console.error(err);
//           app.appendChild(elem);
//         }
//       );
//     })
//     .catch(console.error);
// }

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
  getDecryptedContent(url, file.key, file.iv, file.authTag, file.mime)
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

displayText(files['NYT.txt']);
// displayImage(files['river.jpg']);
displayVideo(files['patreon.mp4']);
// displayVideo(files['k.webm']);
// displayImage(files['turtl.gif']);
