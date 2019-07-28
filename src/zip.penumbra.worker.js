/* eslint-disable class-methods-use-this */

// external
import 'regenerator-runtime/runtime';
import * as Comlink from 'comlink';
// import { fromWritablePort } from 'remote-web-streams';
// import { Zip } from 'conflux';

// local
import onProgress from './utils/forwardProgress';
import './transferHandlers/progress';

// eslint-disable-next-line no-restricted-globals
if (self.document) {
  throw new Error('Worker thread should not be included in document');
}

/**
 * Penumbra Worker class
 */
class PenumbraZipWorker {
  // /**
  //  * Constructs a zip file stream from a list of `PenumbraFile`s
  //  *
  //  * @param writablePort - Remote Web Stream writable port
  //  * @param files - The files to include in the zip
  //  * @returns ReadableStream for the zip output
  //  */
  // async zip(writablePort, files) {
  //   const out = await new Zip();
  //   const remoteStream = fromWritablePort(writablePort);
  //   const localStream = new ArrayBuffer();

  //   files.forEach(async (file, i) => {
  //     if (!('path' in file)) {
  //       throw new Error('penumbra.zip(): PenumbraFile missing path');
  //     }
  //     // add file to output
  //   });

  //   localStream.pipeTo(remoteStream);
  // }

  /**
   * Forward progress events to main thread
   */
  async setup(handler) {
    onProgress.handler = handler;
  }
}

Comlink.expose(PenumbraZipWorker);
