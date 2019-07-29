// import test from 'tape';
// import downloadEncryptedFile from '../downloadEncryptedFile';
// import { ProgressEmit } from '../types';

// import { timeout } from './helpers';
// import { TimeoutManager } from './helpers/timeout';

// test('downloadEncryptedFile', async (t) => {
//   const progressEventName = 'penumbra-progress';
//   const fail = () => {
//     t.fail();
//     t.end();
//   };
//   const initTimeout: TimeoutManager = timeout(fail, 60);
//   let stallTimeout: TimeoutManager;
//   let initFinished = false;
//   let progressStarted = false;
//   let lastPercent: number;
//   const onprogress = (evt: ProgressEmit): void => {
//     const { percent } = evt.detail;
//     if (!Number.isNaN(percent)) {
//       if (!initFinished) {
//         initTimeout.clear();
//         stallTimeout = timeout(fail, 10);
//         initFinished = true;
//         lastPercent = percent;
//       } else if (!progressStarted) {
//         if (percent > lastPercent) {
//           stallTimeout.clear();
//           progressStarted = true;
//         }
//       }
//       if (progressStarted && percent > 25) {
//         self.removeEventListener(progressEventName, onprogress);
//         t.pass();
//         t.end();
//       }
//     }
//     lastPercent = percent;
//   };

//   self.addEventListener(progressEventName, onprogress);
//   await downloadEncryptedFile({
//     url: 'https://s3-us-west-2.amazonaws.com/bencmbrook/patreon.mp4.enc',
//     filePrefix: 'video.mp4',
//     mimetype: 'video/webm',
//     decryptionOptions: {
//       key: 'vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=',
//       iv: '6lNU+2vxJw6SFgse',
//       authTag: 'K3MVZrK2/6+n8/p/74mXkQ==',
//     },
//   });
// });
